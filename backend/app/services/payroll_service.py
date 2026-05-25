from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_
from fastapi import HTTPException
from datetime import date
from decimal import Decimal, ROUND_HALF_UP
from calendar import monthrange

from app.models.payroll import PayrollRun, Payslip, PayrollStatus
from app.models.employee import Employee
from app.models.attendance import AttendanceLog, AttendanceStatus
from app.schemas.payroll import PayrollRunCreate

# ── Sri Lanka Labour Law Constants ──────────────────────────
EPF_EMPLOYEE_RATE = Decimal("0.08")   # 8%
EPF_EMPLOYER_RATE = Decimal("0.12")   # 12%
ETF_EMPLOYER_RATE = Decimal("0.03")   # 3%
OT_RATE_NORMAL    = Decimal("1.5")    # 1.5x for weekday OT
OT_RATE_HOLIDAY   = Decimal("2.0")    # 2x for holiday OT


class PayrollEngine:

    @staticmethod
    def _get_working_days(year: int, month: int) -> int:
        """Count working days in month (Mon-Sat for garments)"""
        _, last_day = monthrange(year, month)
        working = 0
        for day in range(1, last_day + 1):
            weekday = date(year, month, day).weekday()
            if weekday < 6:  # Mon=0 to Sat=5
                working += 1
        return working

    @staticmethod
    def _calculate_payslip(
        db: Session,
        employee: Employee,
        year: int,
        month: int,
        payroll_run_id: int
    ) -> Payslip:
        """Calculate full payslip for one employee"""

        _, last_day = monthrange(year, month)
        start_date  = date(year, month, 1)
        end_date    = date(year, month, last_day)
        working_days = PayrollEngine._get_working_days(year, month)

        # Get attendance records for the month
        records = db.query(AttendanceLog).filter(
            and_(
                AttendanceLog.employee_id == employee.id,
                AttendanceLog.date >= start_date,
                AttendanceLog.date <= end_date
            )
        ).all()

        # Count attendance
        present_days = Decimal(str(
            sum(1 for r in records if r.status == AttendanceStatus.PRESENT)
        ))
        on_leave_days = Decimal(str(
            sum(1 for r in records if r.status == AttendanceStatus.ON_LEAVE)
        ))
        half_days = Decimal(str(
            sum(1 for r in records if r.status == AttendanceStatus.HALF_DAY)
        ))

        # Paid days = present + on_leave + half_days*0.5
        paid_days   = present_days + on_leave_days + (half_days * Decimal("0.5"))
        no_pay_days = max(Decimal(str(working_days)) - paid_days, Decimal("0"))
        absent_days = max(Decimal(str(working_days)) - present_days - on_leave_days, Decimal("0"))

        # Total OT hours
        total_ot_hours = sum(
            (r.ot_hours or Decimal("0")) for r in records
        )

        # ── EARNINGS ─────────────────────────────────────────
        basic_salary = Decimal(str(employee.basic_salary))
        daily_rate   = (basic_salary / Decimal(str(working_days))).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )

        # No-pay deduction from basic
        no_pay_deduct = (daily_rate * no_pay_days).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )

        # Effective basic after no-pay
        effective_basic = (basic_salary - no_pay_deduct).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )

        # OT calculation (hourly rate = basic / (working_days * 8hrs))
        hourly_rate = (basic_salary / (Decimal(str(working_days)) * Decimal("8"))).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        ot_amount = (
            Decimal(str(total_ot_hours)) * hourly_rate * OT_RATE_NORMAL
        ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        # Fixed allowances (configurable per employee in future)
        attendance_allow = Decimal("1500") if present_days >= Decimal(str(working_days)) else Decimal("0")
        transport_allow  = Decimal("1000")
        meal_allow       = (present_days * Decimal("100")).quantize(Decimal("0.01"))
        other_allow      = Decimal("0")

        gross_salary = (
            effective_basic + ot_amount +
            attendance_allow + transport_allow +
            meal_allow + other_allow
        ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        # ── DEDUCTIONS ────────────────────────────────────────
        # EPF calculated on basic salary only (not allowances)
        epf_employee = (basic_salary * EPF_EMPLOYEE_RATE).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        loan_deduct  = Decimal("0")   # Loan module coming later
        other_deduct = Decimal("0")

        total_deductions = (
            epf_employee + no_pay_deduct + loan_deduct + other_deduct
        ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        # ── EMPLOYER CONTRIBUTIONS ────────────────────────────
        epf_employer = (basic_salary * EPF_EMPLOYER_RATE).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        etf_employer = (basic_salary * ETF_EMPLOYER_RATE).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )

        # ── NET SALARY ────────────────────────────────────────
        net_salary = (gross_salary - epf_employee).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )

        return Payslip(
            payroll_run_id   = payroll_run_id,
            employee_id      = employee.id,
            working_days     = working_days,
            present_days     = present_days,
            absent_days      = absent_days,
            no_pay_days      = no_pay_days,
            ot_hours         = Decimal(str(total_ot_hours)),
            basic_salary     = basic_salary,
            ot_amount        = ot_amount,
            attendance_allow = attendance_allow,
            transport_allow  = transport_allow,
            meal_allow       = meal_allow,
            other_allow      = other_allow,
            gross_salary     = gross_salary,
            epf_employee     = epf_employee,
            no_pay_deduct    = no_pay_deduct,
            loan_deduct      = loan_deduct,
            other_deduct     = other_deduct,
            total_deductions = total_deductions,
            epf_employer     = epf_employer,
            etf_employer     = etf_employer,
            net_salary       = net_salary
        )


class PayrollService:

    @staticmethod
    def create_run(db: Session, data: PayrollRunCreate, processed_by: int) -> PayrollRun:
        # Check no duplicate run for same month/year
        existing = db.query(PayrollRun).filter(
            and_(
                PayrollRun.month == data.month,
                PayrollRun.year  == data.year
            )
        ).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Payroll run already exists for {data.month}/{data.year}"
            )

        _, last_day  = monthrange(data.year, data.month)
        period_start = date(data.year, data.month, 1)
        period_end   = date(data.year, data.month, last_day)

        run = PayrollRun(
            month        = data.month,
            year         = data.year,
            period_start = period_start,
            period_end   = period_end,
            status       = PayrollStatus.DRAFT,
            processed_by = processed_by,
            notes        = data.notes
        )
        db.add(run)
        db.commit()
        db.refresh(run)
        return run

    @staticmethod
    def process_run(db: Session, run_id: int) -> dict:
        """Calculate payslips for ALL active employees"""
        run = db.query(PayrollRun).filter(PayrollRun.id == run_id).first()
        if not run:
            raise HTTPException(status_code=404, detail="Payroll run not found")
        if run.status not in [PayrollStatus.DRAFT]:
            raise HTTPException(status_code=400, detail="Payroll run already processed")

        # Delete any existing payslips for this run (re-process)
        db.query(Payslip).filter(Payslip.payroll_run_id == run_id).delete()

        employees = db.query(Employee).filter(Employee.is_active == True).all()
        payslips  = []

        for employee in employees:
            payslip = PayrollEngine._calculate_payslip(
                db, employee, run.year, run.month, run_id
            )
            db.add(payslip)
            payslips.append(payslip)

        run.status = PayrollStatus.PENDING
        db.commit()

        return {
            "message": f"Payroll processed for {len(payslips)} employees",
            "run_id": run_id,
            "month": run.month,
            "year": run.year,
            "total_employees": len(payslips)
        }

    @staticmethod
    def approve_run(db: Session, run_id: int, approved_by: int) -> dict:
        run = db.query(PayrollRun).filter(PayrollRun.id == run_id).first()
        if not run:
            raise HTTPException(status_code=404, detail="Payroll run not found")
        if run.status != PayrollStatus.PENDING:
            raise HTTPException(status_code=400, detail="Only pending payrolls can be approved")

        run.status      = PayrollStatus.APPROVED
        run.approved_by = approved_by
        db.commit()
        return {"message": f"Payroll {run.month}/{run.year} approved successfully"}

    @staticmethod
    def get_run_summary(db: Session, run_id: int) -> dict:
        run = db.query(PayrollRun).filter(PayrollRun.id == run_id).first()
        if not run:
            raise HTTPException(status_code=404, detail="Payroll run not found")

        payslips = db.query(Payslip).filter(Payslip.payroll_run_id == run_id).all()

        total_gross        = sum(p.gross_salary     for p in payslips)
        total_epf_employee = sum(p.epf_employee     for p in payslips)
        total_epf_employer = sum(p.epf_employer     for p in payslips)
        total_etf          = sum(p.etf_employer     for p in payslips)
        total_net          = sum(p.net_salary        for p in payslips)
        total_ot           = sum(p.ot_amount         for p in payslips)

        return {
            "payroll_run_id":     run_id,
            "month":              run.month,
            "year":               run.year,
            "status":             run.status,
            "total_employees":    len(payslips),
            "total_gross":        float(total_gross),
            "total_epf_employee": float(total_epf_employee),
            "total_epf_employer": float(total_epf_employer),
            "total_etf":          float(total_etf),
            "total_net":          float(total_net),
            "total_ot_cost":      float(total_ot),
            "payslips":           payslips
        }

    @staticmethod
    def get_employee_payslip(db: Session, run_id: int, employee_id: int) -> Payslip:
        payslip = db.query(Payslip).filter(
            and_(
                Payslip.payroll_run_id == run_id,
                Payslip.employee_id   == employee_id
            )
        ).first()
        if not payslip:
            raise HTTPException(status_code=404, detail="Payslip not found")
        return payslip

    @staticmethod
    def get_epf_etf_report(db: Session, run_id: int) -> dict:
        """Generate EPF/ETF report for government submission"""
        run = db.query(PayrollRun).filter(PayrollRun.id == run_id).first()
        if not run:
            raise HTTPException(status_code=404, detail="Payroll run not found")

        payslips = db.query(Payslip).options(
            joinedload(Payslip.employee)
        ).filter(Payslip.payroll_run_id == run_id).all()

        records = []
        for p in payslips:
            records.append({
                "employee_no":   p.employee.employee_no,
                "full_name":     p.employee.full_name,
                "nic":           p.employee.nic,
                "epf_no":        p.employee.epf_no or "N/A",
                "basic_salary":  float(p.basic_salary),
                "epf_employee":  float(p.epf_employee),
                "epf_employer":  float(p.epf_employer),
                "etf_employer":  float(p.etf_employer),
                "total_epf":     float(p.epf_employee + p.epf_employer),
            })

        return {
            "month":              run.month,
            "year":               run.year,
            "total_employees":    len(records),
            "total_epf_employee": float(sum(p.epf_employee for p in payslips)),
            "total_epf_employer": float(sum(p.epf_employer for p in payslips)),
            "total_etf":          float(sum(p.etf_employer for p in payslips)),
            "total_epf_payable":  float(sum(p.epf_employee + p.epf_employer for p in payslips)),
            "records":            records
        }

    @staticmethod
    def get_bank_file(db: Session, run_id: int) -> list:
        """Generate bank transfer file data"""
        payslips = db.query(Payslip).options(
            joinedload(Payslip.employee)
        ).filter(Payslip.payroll_run_id == run_id).all()

        return [
            {
                "employee_no":    p.employee.employee_no,
                "full_name":      p.employee.full_name,
                "bank_name":      p.employee.bank_name or "",
                "bank_branch":    p.employee.bank_branch or "",
                "account_no":     p.employee.bank_account_no or "",
                "net_salary":     float(p.net_salary),
                "reference":      f"SAL-{p.payroll_run_id}-{p.employee.employee_no}"
            }
            for p in payslips
        ]

    @staticmethod
    def get_all_runs(db: Session) -> list:
        return db.query(PayrollRun).order_by(
            PayrollRun.year.desc(), PayrollRun.month.desc()
        ).all()