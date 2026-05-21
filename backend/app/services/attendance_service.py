from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_
from fastapi import HTTPException
from typing import Optional
from datetime import date, datetime, timedelta
from decimal import Decimal

from app.models.attendance import (
    AttendanceLog, AttendanceStatus, Shift,
    LeaveRequest, LeaveBalance, LeaveStatus, LeaveType
)
from app.models.employee import Employee
from app.schemas.attendance import (
    ManualAttendanceCreate, BiometricLogCreate,
    LeaveRequestCreate, LeaveApproval, ShiftCreate
)


class ShiftService:

    @staticmethod
    def create(db: Session, data: ShiftCreate) -> Shift:
        shift = Shift(**data.model_dump())
        db.add(shift)
        db.commit()
        db.refresh(shift)
        return shift

    @staticmethod
    def get_all(db: Session) -> list[Shift]:
        return db.query(Shift).filter(Shift.is_active == True).all()


class AttendanceService:

    @staticmethod
    def _calculate_attendance(
        check_in: Optional[datetime],
        check_out: Optional[datetime],
        shift: Optional[Shift]
    ) -> dict:
        """Core logic: calculate late mins, OT, worked hours"""
        result = {
            "late_minutes": 0,
            "early_out_mins": 0,
            "ot_hours": Decimal("0"),
            "worked_hours": Decimal("0"),
            "status": AttendanceStatus.PRESENT
        }

        if not check_in:
            result["status"] = AttendanceStatus.ABSENT
            return result

        if check_out and check_in:
            # Calculate worked hours
            worked = (
                datetime.combine(date.today(), check_out) -
                datetime.combine(date.today(), check_in)
            )
            worked_hours = Decimal(str(round(worked.seconds / 3600, 2)))
            result["worked_hours"] = worked_hours

            # Half day check
            if worked_hours < Decimal("4"):
                result["status"] = AttendanceStatus.HALF_DAY

            if shift:
                # Late minutes
                shift_start = datetime.combine(date.today(), shift.start_time)
                grace_end   = shift_start + timedelta(minutes=shift.grace_minutes)
                check_in_dt = datetime.combine(date.today(), check_in)

                if check_in_dt > grace_end:
                    late = (check_in_dt - shift_start).seconds // 60
                    result["late_minutes"] = late

                # OT hours
                ot_threshold = Decimal(str(shift.ot_starts_after))
                if worked_hours > ot_threshold:
                    result["ot_hours"] = worked_hours - ot_threshold

                # Early out
                shift_end    = datetime.combine(date.today(), shift.end_time)
                check_out_dt = datetime.combine(date.today(), check_out)
                if check_out_dt < shift_end:
                    early = (shift_end - check_out_dt).seconds // 60
                    result["early_out_mins"] = early

        return result

    @staticmethod
    def manual_entry(db: Session, data: ManualAttendanceCreate) -> AttendanceLog:
        # Check employee exists
        employee = db.query(Employee).filter(Employee.id == data.employee_id).first()
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")

        # Check duplicate
        existing = db.query(AttendanceLog).filter(
            and_(
                AttendanceLog.employee_id == data.employee_id,
                AttendanceLog.date == data.date
            )
        ).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Attendance already recorded for {data.date}"
            )

        shift = None
        if data.shift_id:
            shift = db.query(Shift).filter(Shift.id == data.shift_id).first()

        calc = AttendanceService._calculate_attendance(
            data.check_in, data.check_out, shift
        )

        log = AttendanceLog(
            employee_id    = data.employee_id,
            date           = data.date,
            check_in       = data.check_in,
            check_out      = data.check_out,
            shift_id       = data.shift_id,
            is_manual      = True,
            notes          = data.notes,
            status         = calc["status"],
            late_minutes   = calc["late_minutes"],
            early_out_mins = calc["early_out_mins"],
            ot_hours       = calc["ot_hours"],
            worked_hours   = calc["worked_hours"]
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return log

    @staticmethod
    def biometric_punch(db: Session, data: BiometricLogCreate) -> dict:
        """Process a punch from biometric device"""
        # Find employee by biometric ID
        employee = db.query(Employee).filter(
            Employee.biometric_id == data.biometric_id
        ).first()
        if not employee:
            raise HTTPException(
                status_code=404,
                detail=f"No employee found for biometric ID: {data.biometric_id}"
            )

        # Parse timestamp
        punch_dt   = datetime.strptime(data.timestamp, "%Y-%m-%d %H:%M:%S")
        punch_date = punch_dt.date()
        punch_time = punch_dt.time()

        # Check if record exists for today
        existing = db.query(AttendanceLog).filter(
            and_(
                AttendanceLog.employee_id == employee.id,
                AttendanceLog.date == punch_date
            )
        ).first()

        if not existing:
            # First punch = check-in
            log = AttendanceLog(
                employee_id = employee.id,
                date        = punch_date,
                check_in    = punch_time,
                status      = AttendanceStatus.PRESENT,
                is_manual   = False
            )
            db.add(log)
            db.commit()
            return {"action": "check_in", "employee": employee.full_name, "time": str(punch_time)}
        else:
            # Second punch = check-out (update existing)
            existing.check_out = punch_time

            # Get shift for calculations
            shift = None
            if existing.shift_id:
                shift = db.query(Shift).filter(Shift.id == existing.shift_id).first()

            calc = AttendanceService._calculate_attendance(
                existing.check_in, punch_time, shift
            )
            existing.worked_hours   = calc["worked_hours"]
            existing.ot_hours       = calc["ot_hours"]
            existing.late_minutes   = calc["late_minutes"]
            existing.early_out_mins = calc["early_out_mins"]
            existing.status         = calc["status"]

            db.commit()
            return {"action": "check_out", "employee": employee.full_name, "time": str(punch_time)}

    @staticmethod
    def get_daily_report(db: Session, report_date: date) -> dict:
        """Get full attendance report for a specific date"""
        total_employees = db.query(Employee).filter(Employee.is_active == True).count()

        records = db.query(AttendanceLog).options(
            joinedload(AttendanceLog.employee)
        ).filter(AttendanceLog.date == report_date).all()

        present  = sum(1 for r in records if r.status == AttendanceStatus.PRESENT)
        on_leave = sum(1 for r in records if r.status == AttendanceStatus.ON_LEAVE)
        absent   = total_employees - present - on_leave

        return {
            "date": report_date,
            "total_employees": total_employees,
            "present": present,
            "absent": absent,
            "on_leave": on_leave,
            "attendance_rate": round((present / total_employees * 100), 2) if total_employees > 0 else 0,
            "records": records
        }

    @staticmethod
    def get_employee_attendance(
        db: Session,
        employee_id: int,
        start_date: date,
        end_date: date
    ) -> dict:
        """Get attendance history for one employee"""
        employee = db.query(Employee).filter(Employee.id == employee_id).first()
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")

        records = db.query(AttendanceLog).filter(
            and_(
                AttendanceLog.employee_id == employee_id,
                AttendanceLog.date >= start_date,
                AttendanceLog.date <= end_date
            )
        ).order_by(AttendanceLog.date).all()

        present_days = sum(1 for r in records if r.status == AttendanceStatus.PRESENT)
        absent_days  = sum(1 for r in records if r.status == AttendanceStatus.ABSENT)
        late_days    = sum(1 for r in records if r.late_minutes > 0)
        total_ot     = sum(r.ot_hours for r in records if r.ot_hours)
        total_days   = (end_date - start_date).days + 1

        return {
            "employee_id": employee_id,
            "employee_no": employee.employee_no,
            "full_name": employee.full_name,
            "period": {"start": start_date, "end": end_date},
            "summary": {
                "present_days": present_days,
                "absent_days": absent_days,
                "late_days": late_days,
                "total_ot_hours": float(total_ot),
                "attendance_rate": round(present_days / total_days * 100, 2) if total_days > 0 else 0
            },
            "records": records
        }

    @staticmethod
    def get_monthly_summary(db: Session, year: int, month: int) -> list:
        """Summary of all employees for a month — used for payroll"""
        from calendar import monthrange
        _, last_day = monthrange(year, month)
        start = date(year, month, 1)
        end   = date(year, month, last_day)

        employees = db.query(Employee).filter(Employee.is_active == True).all()
        summary   = []

        for emp in employees:
            records = db.query(AttendanceLog).filter(
                and_(
                    AttendanceLog.employee_id == emp.id,
                    AttendanceLog.date >= start,
                    AttendanceLog.date <= end
                )
            ).all()

            present  = sum(1 for r in records if r.status == AttendanceStatus.PRESENT)
            on_leave = sum(1 for r in records if r.status == AttendanceStatus.ON_LEAVE)
            absent   = last_day - present - on_leave
            ot_hours = float(sum(r.ot_hours for r in records if r.ot_hours))

            summary.append({
                "employee_id":   emp.id,
                "employee_no":   emp.employee_no,
                "full_name":     emp.full_name,
                "present_days":  present,
                "absent_days":   max(absent, 0),
                "on_leave_days": on_leave,
                "total_ot_hours": ot_hours,
                "attendance_rate": round(present / last_day * 100, 2)
            })

        return summary


class LeaveService:

    @staticmethod
    def apply(db: Session, data: LeaveRequestCreate) -> LeaveRequest:
        employee = db.query(Employee).filter(Employee.id == data.employee_id).first()
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")

        # Calculate total days
        delta      = (data.end_date - data.start_date).days + 1
        total_days = Decimal(str(delta))

        # Check leave balance for annual/casual/medical
        if data.leave_type in [LeaveType.ANNUAL, LeaveType.CASUAL, LeaveType.MEDICAL]:
            balance = db.query(LeaveBalance).filter(
                and_(
                    LeaveBalance.employee_id == data.employee_id,
                    LeaveBalance.leave_type  == data.leave_type,
                    LeaveBalance.year        == data.start_date.year
                )
            ).first()

            if balance and balance.remaining < total_days:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient {data.leave_type} leave balance. "
                           f"Available: {balance.remaining}, Requested: {total_days}"
                )

        leave = LeaveRequest(
            employee_id = data.employee_id,
            leave_type  = data.leave_type,
            start_date  = data.start_date,
            end_date    = data.end_date,
            total_days  = total_days,
            reason      = data.reason,
            status      = LeaveStatus.PENDING
        )
        db.add(leave)
        db.commit()
        db.refresh(leave)
        return leave

    @staticmethod
    def approve_reject(
        db: Session,
        leave_id: int,
        data: LeaveApproval,
        approved_by_id: int
    ) -> LeaveRequest:
        leave = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
        if not leave:
            raise HTTPException(status_code=404, detail="Leave request not found")
        if leave.status != LeaveStatus.PENDING:
            raise HTTPException(status_code=400, detail="Leave already processed")

        leave.status      = data.status
        leave.approved_by = approved_by_id
        leave.reject_reason = data.reject_reason

        # If approved — update attendance logs and balance
        if data.status == LeaveStatus.APPROVED:
            current = leave.start_date
            while current <= leave.end_date:
                existing = db.query(AttendanceLog).filter(
                    and_(
                        AttendanceLog.employee_id == leave.employee_id,
                        AttendanceLog.date == current
                    )
                ).first()
                if existing:
                    existing.status = AttendanceStatus.ON_LEAVE
                else:
                    db.add(AttendanceLog(
                        employee_id = leave.employee_id,
                        date        = current,
                        status      = AttendanceStatus.ON_LEAVE,
                        is_manual   = True,
                        notes       = f"On {leave.leave_type} leave"
                    ))
                current += timedelta(days=1)

            # Deduct from balance
            balance = db.query(LeaveBalance).filter(
                and_(
                    LeaveBalance.employee_id == leave.employee_id,
                    LeaveBalance.leave_type  == leave.leave_type,
                    LeaveBalance.year        == leave.start_date.year
                )
            ).first()
            if balance:
                balance.taken     += leave.total_days
                balance.remaining -= leave.total_days

        db.commit()
        db.refresh(leave)
        return leave

    @staticmethod
    def get_pending(db: Session) -> list[LeaveRequest]:
        return db.query(LeaveRequest).filter(
            LeaveRequest.status == LeaveStatus.PENDING
        ).order_by(LeaveRequest.created_at.desc()).all()

    @staticmethod
    def get_employee_leaves(db: Session, employee_id: int) -> list[LeaveRequest]:
        return db.query(LeaveRequest).filter(
            LeaveRequest.employee_id == employee_id
        ).order_by(LeaveRequest.created_at.desc()).all()

    @staticmethod
    def initialize_leave_balance(db: Session, employee_id: int, year: int):
        """Create default leave balances for a new employee"""
        defaults = {
            LeaveType.ANNUAL:   14,
            LeaveType.CASUAL:   7,
            LeaveType.MEDICAL:  14,
        }
        for leave_type, days in defaults.items():
            existing = db.query(LeaveBalance).filter(
                and_(
                    LeaveBalance.employee_id == employee_id,
                    LeaveBalance.leave_type  == leave_type,
                    LeaveBalance.year        == year
                )
            ).first()
            if not existing:
                db.add(LeaveBalance(
                    employee_id = employee_id,
                    year        = year,
                    leave_type  = leave_type,
                    entitled    = Decimal(str(days)),
                    taken       = Decimal("0"),
                    remaining   = Decimal(str(days))
                ))
        db.commit()