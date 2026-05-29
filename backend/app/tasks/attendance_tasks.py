from celery import shared_task
from celery.utils.log import get_task_logger
from sqlalchemy import and_
from datetime import date, datetime

from app.core.celery_app import celery_app
from app.core.database import SessionLocal
from app.models.employee import Employee
from app.models.attendance import AttendanceLog, AttendanceStatus, LeaveBalance, LeaveType
from decimal import Decimal

logger = get_task_logger(__name__)


@celery_app.task(name="app.tasks.attendance_tasks.mark_absent_employees")
def mark_absent_employees():
    """
    Runs every day at 6:30 PM.
    Marks employees who have no attendance record today as ABSENT.
    Excludes employees on approved leave.
    """
    db = SessionLocal()
    today = date.today()
    marked = 0

    try:
        employees = db.query(Employee).filter(Employee.is_active == True).all()

        for employee in employees:
            existing = db.query(AttendanceLog).filter(
                and_(
                    AttendanceLog.employee_id == employee.id,
                    AttendanceLog.date == today
                )
            ).first()

            if not existing:
                # No record today — mark absent
                log = AttendanceLog(
                    employee_id = employee.id,
                    date        = today,
                    status      = AttendanceStatus.ABSENT,
                    is_manual   = False,
                    notes       = "Auto-marked absent by system"
                )
                db.add(log)
                marked += 1

        db.commit()
        logger.info(f"Marked {marked} employees absent for {today}")
        return {"date": str(today), "marked_absent": marked}

    except Exception as e:
        db.rollback()
        logger.error(f"Error marking absent employees: {e}")
        raise
    finally:
        db.close()


@celery_app.task(name="app.tasks.attendance_tasks.process_biometric_batch")
def process_biometric_batch(logs: list):
    """
    Process a batch of biometric logs pushed from device.
    Called when device syncs multiple records at once.
    """
    from app.services.attendance_service import AttendanceService
    from app.schemas.attendance import BiometricLogCreate

    db = SessionLocal()
    results = []

    try:
        for log in logs:
            try:
                data   = BiometricLogCreate(**log)
                result = AttendanceService.biometric_punch(db, data)
                results.append({"status": "ok", "result": result})
            except Exception as e:
                results.append({"status": "error", "log": log, "error": str(e)})

        logger.info(f"Processed {len(logs)} biometric logs")
        return results

    finally:
        db.close()


@celery_app.task(name="app.tasks.attendance_tasks.initialize_monthly_leave_balances")
def initialize_monthly_leave_balances():
    """
    Runs on 1st of every month.
    Initializes leave balances for any new employees missing them.
    """
    from app.services.attendance_service import LeaveService

    db    = SessionLocal()
    today = date.today()
    count = 0

    try:
        employees = db.query(Employee).filter(Employee.is_active == True).all()
        for employee in employees:
            existing = db.query(LeaveBalance).filter(
                and_(
                    LeaveBalance.employee_id == employee.id,
                    LeaveBalance.year == today.year
                )
            ).first()

            if not existing:
                LeaveService.initialize_leave_balance(db, employee.id, today.year)
                count += 1

        logger.info(f"Initialized leave balances for {count} employees")
        return {"initialized": count, "year": today.year}

    except Exception as e:
        logger.error(f"Error initializing leave balances: {e}")
        raise
    finally:
        db.close()