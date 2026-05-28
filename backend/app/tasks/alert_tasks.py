from celery.utils.log import get_task_logger
from sqlalchemy import and_, func
from datetime import date
from calendar import monthrange

from app.core.celery_app import celery_app
from app.core.database import SessionLocal
from app.models.employee import Employee
from app.models.attendance import AttendanceLog, AttendanceStatus, LeaveRequest, LeaveStatus
from app.models.payroll import Payslip, PayrollRun

logger = get_task_logger(__name__)


@celery_app.task(name="app.tasks.alert_tasks.save_daily_kpi_snapshot")
def save_daily_kpi_snapshot():
    """
    Saves today's KPIs to a JSON log for trend analysis.
    Runs every day at 7:00 PM.
    """
    from app.services.analytics_service import ExecutiveDashboard
    import json, os

    db    = SessionLocal()
    today = date.today()

    try:
        kpis = ExecutiveDashboard.get_kpis(db)

        # Save to a daily log file
        log_dir = "logs/kpi_snapshots"
        os.makedirs(log_dir, exist_ok=True)

        filepath = f"{log_dir}/{today}.json"
        with open(filepath, "w") as f:
            json.dump(kpis, f, default=str, indent=2)

        logger.info(f"KPI snapshot saved for {today}")
        return {"date": str(today), "snapshot_saved": True}

    except Exception as e:
        logger.error(f"Error saving KPI snapshot: {e}")
        raise
    finally:
        db.close()


@celery_app.task(name="app.tasks.alert_tasks.check_and_send_alerts")
def check_and_send_alerts():
    """
    Checks all KPI thresholds and logs alerts.
    Runs every day at 7:30 PM.
    In production: sends emails via SMTP.
    """
    db    = SessionLocal()
    today = date.today()
    alerts_triggered = []

    try:
        total_employees = db.query(Employee).filter(Employee.is_active == True).count()
        if total_employees == 0:
            return {"alerts": []}

        # ── 1. Check today's attendance rate ────────────
        present_today = db.query(AttendanceLog).filter(
            and_(
                AttendanceLog.date   == today,
                AttendanceLog.status == AttendanceStatus.PRESENT
            )
        ).count()

        attendance_rate = round(present_today / total_employees * 100, 2)

        if attendance_rate < 85:
            alert = {
                "type":     "CRITICAL_ABSENTEEISM",
                "severity": "critical",
                "message":  f"Attendance dropped to {attendance_rate}% on {today}",
                "threshold": 85,
                "actual":    attendance_rate
            }
            alerts_triggered.append(alert)
            logger.warning(f"ALERT: {alert['message']}")

        # ── 2. Check pending leave requests ─────────────
        pending = db.query(LeaveRequest).filter(
            LeaveRequest.status == LeaveStatus.PENDING
        ).count()

        if pending > 10:
            alert = {
                "type":     "HIGH_PENDING_LEAVES",
                "severity": "warning",
                "message":  f"{pending} leave requests pending approval",
                "threshold": 10,
                "actual":    pending
            }
            alerts_triggered.append(alert)

        # ── 3. Check monthly turnover ────────────────────
        _, last_day = monthrange(today.year, today.month)
        month_start = date(today.year, today.month, 1)

        resignations = db.query(Employee).filter(
            and_(
                Employee.resigned_date >= month_start,
                Employee.resigned_date <= today
            )
        ).count()

        turnover_rate = round(resignations / total_employees * 100, 2)
        if turnover_rate > 5:
            alert = {
                "type":     "HIGH_TURNOVER",
                "severity": "warning",
                "message":  f"Monthly turnover rate reached {turnover_rate}%",
                "threshold": 5,
                "actual":    turnover_rate
            }
            alerts_triggered.append(alert)

        # ── 4. Check OT budget ───────────────────────────
        ot_result = db.query(func.sum(AttendanceLog.ot_hours)).filter(
            AttendanceLog.date >= month_start
        ).scalar()
        total_ot = float(ot_result or 0)

        # Alert if OT > 200 hours total this month
        if total_ot > 200:
            alert = {
                "type":     "HIGH_OT_HOURS",
                "severity": "warning",
                "message":  f"Total OT this month: {total_ot:.1f} hrs (limit: 200)",
                "threshold": 200,
                "actual":    total_ot
            }
            alerts_triggered.append(alert)

        # Log all alerts
        if alerts_triggered:
            logger.warning(f"=== {len(alerts_triggered)} ALERTS TRIGGERED for {today} ===")
            for a in alerts_triggered:
                logger.warning(f"  [{a['severity'].upper()}] {a['message']}")
        else:
            logger.info(f"All KPIs within threshold for {today}")

        return {
            "date":              str(today),
            "alerts_triggered":  len(alerts_triggered),
            "alerts":            alerts_triggered
        }

    except Exception as e:
        logger.error(f"Error checking alerts: {e}")
        raise
    finally:
        db.close()


@celery_app.task(name="app.tasks.alert_tasks.check_probation_expiry")
def check_probation_expiry():
    """
    Checks for employees whose probation ends in 7 days.
    Logs reminder for HR Manager.
    """
    from datetime import timedelta

    db            = SessionLocal()
    today         = date.today()
    reminder_date = today + timedelta(days=7)
    upcoming      = []

    try:
        employees = db.query(Employee).filter(
            and_(
                Employee.probation_end == reminder_date,
                Employee.is_active == True
            )
        ).all()

        for emp in employees:
            upcoming.append({
                "employee_no":  emp.employee_no,
                "full_name":    emp.full_name,
                "probation_end": str(emp.probation_end)
            })
            logger.info(
                f"REMINDER: Probation ending for "
                f"{emp.full_name} ({emp.employee_no}) on {emp.probation_end}"
            )

        return {"reminders": len(upcoming), "employees": upcoming}

    finally:
        db.close()