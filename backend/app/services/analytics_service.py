import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from datetime import date, timedelta
from decimal import Decimal
from calendar import monthrange

from app.models.employee import Employee
from app.models.attendance import AttendanceLog, AttendanceStatus, LeaveRequest, LeaveStatus
from app.models.payroll import Payslip, PayrollRun
from app.models.department import Department


class AttendanceAnalytics:

    @staticmethod
    def absenteeism_report(db: Session, year: int, month: int) -> list:
        """
        Absenteeism rate per department.
        Decision: Redeploy workers, issue warnings, activate casuals.
        """
        _, last_day = monthrange(year, month)
        start = date(year, month, 1)
        end   = date(year, month, last_day)

        # Pull all attendance logs with employee & department data
        rows = (
            db.query(
                AttendanceLog.employee_id,
                AttendanceLog.status,
                Employee.full_name,
                Department.name.label("department_name")
            )
            .join(Employee, AttendanceLog.employee_id == Employee.id)
            .join(Department, Employee.department_id == Department.id)
            .filter(and_(AttendanceLog.date >= start, AttendanceLog.date <= end))
            .all()
        )

        if not rows:
            return []

        # Use pandas for fast grouping
        df = pd.DataFrame(rows, columns=["employee_id", "status", "full_name", "department"])

        results = []
        for dept, group in df.groupby("department"):
            total_employees = group["employee_id"].nunique()
            total_records   = len(group)
            absent_records  = len(group[group["status"] == AttendanceStatus.ABSENT])

            attendance_rate = round(
                ((total_records - absent_records) / total_records * 100), 2
            ) if total_records > 0 else 0

            # Chronic absentees: absent > 3 days in month
            absent_df = group[group["status"] == AttendanceStatus.ABSENT]
            chronic   = absent_df.groupby("employee_id").size()
            chronic_count = int((chronic > 3).sum())

            results.append({
                "department":          dept,
                "total_employees":     total_employees,
                "avg_attendance_rate": attendance_rate,
                "total_absent_days":   absent_records,
                "chronic_absentees":   chronic_count
            })

        return sorted(results, key=lambda x: x["avg_attendance_rate"])

    @staticmethod
    def late_arrival_report(db: Session, year: int, month: int) -> list:
        """
        Late arrival frequency per employee.
        Decision: Apply deductions, counseling, warnings.
        """
        _, last_day = monthrange(year, month)
        start = date(year, month, 1)
        end   = date(year, month, last_day)

        rows = (
            db.query(
                AttendanceLog.employee_id,
                AttendanceLog.late_minutes,
                Employee.employee_no,
                Employee.full_name,
                Department.name.label("department")
            )
            .join(Employee, AttendanceLog.employee_id == Employee.id)
            .join(Department, Employee.department_id == Department.id)
            .filter(and_(
                AttendanceLog.date >= start,
                AttendanceLog.date <= end,
                AttendanceLog.late_minutes > 0
            ))
            .all()
        )

        if not rows:
            return []

        df = pd.DataFrame(rows, columns=[
            "employee_id", "late_minutes", "employee_no", "full_name", "department"
        ])

        results = []
        for (emp_id, emp_no, name, dept), group in df.groupby(
            ["employee_id", "employee_no", "full_name", "department"]
        ):
            results.append({
                "employee_id":       int(emp_id),
                "employee_no":       emp_no,
                "full_name":         name,
                "department":        dept,
                "late_count":        len(group),
                "total_late_minutes": int(group["late_minutes"].sum()),
                "avg_late_minutes":  round(float(group["late_minutes"].mean()), 1)
            })

        return sorted(results, key=lambda x: x["late_count"], reverse=True)

    @staticmethod
    def ot_analysis(db: Session, year: int, month: int) -> dict:
        """
        OT hours and cost analysis.
        Decision: Cap OT, control budget, compliance check.
        """
        _, last_day = monthrange(year, month)
        start = date(year, month, 1)
        end   = date(year, month, last_day)

        rows = (
            db.query(
                AttendanceLog.employee_id,
                AttendanceLog.ot_hours,
                Employee.employee_no,
                Employee.full_name,
                Employee.basic_salary,
                Department.name.label("department")
            )
            .join(Employee, AttendanceLog.employee_id == Employee.id)
            .join(Department, Employee.department_id == Department.id)
            .filter(and_(
                AttendanceLog.date >= start,
                AttendanceLog.date <= end,
                AttendanceLog.ot_hours > 0
            ))
            .all()
        )

        if not rows:
            return {"records": [], "summary": {}}

        df = pd.DataFrame(rows, columns=[
            "employee_id", "ot_hours", "employee_no",
            "full_name", "basic_salary", "department"
        ])
        df["ot_hours"]     = df["ot_hours"].astype(float)
        df["basic_salary"] = df["basic_salary"].astype(float)

        # Hourly OT rate = (basic / (working_days * 8)) * 1.5
        working_days = 26
        df["hourly_ot_rate"] = (df["basic_salary"] / (working_days * 8)) * 1.5
        df["ot_cost"]        = df["ot_hours"] * df["hourly_ot_rate"]

        records = []
        for (emp_id, emp_no, name, dept), group in df.groupby(
            ["employee_id", "employee_no", "full_name", "department"]
        ):
            records.append({
                "employee_id":    int(emp_id),
                "employee_no":    emp_no,
                "full_name":      name,
                "department":     dept,
                "total_ot_hours": round(float(group["ot_hours"].sum()), 2),
                "ot_cost":        round(float(group["ot_cost"].sum()), 2),
                "ot_days":        len(group)
            })

        # Department summary
        dept_summary = df.groupby("department").agg(
            total_ot_hours=("ot_hours", "sum"),
            total_ot_cost=("ot_cost", "sum"),
            employees=("employee_id", "nunique")
        ).reset_index().to_dict("records")

        return {
            "records": sorted(records, key=lambda x: x["total_ot_hours"], reverse=True),
            "department_summary": dept_summary,
            "grand_total_ot_hours": round(df["ot_hours"].sum(), 2),
            "grand_total_ot_cost":  round(df["ot_cost"].sum(), 2)
        }

    @staticmethod
    def monday_friday_pattern(db: Session, year: int, month: int) -> dict:
        """
        Detect Monday/Friday absenteeism pattern.
        Decision: Investigate weekend-avoidance behavior.
        """
        _, last_day = monthrange(year, month)
        start = date(year, month, 1)
        end   = date(year, month, last_day)

        rows = (
            db.query(AttendanceLog.date, AttendanceLog.status, AttendanceLog.employee_id)
            .filter(and_(
                AttendanceLog.date >= start,
                AttendanceLog.date <= end,
                AttendanceLog.status == AttendanceStatus.ABSENT
            ))
            .all()
        )

        if not rows:
            return {}

        df = pd.DataFrame(rows, columns=["date", "status", "employee_id"])
        df["date"]    = pd.to_datetime(df["date"])
        df["weekday"] = df["date"].dt.day_name()

        pattern = df.groupby("weekday").size().to_dict()

        return {
            "absences_by_weekday": pattern,
            "monday_absences":  pattern.get("Monday", 0),
            "friday_absences":  pattern.get("Friday", 0),
            "alert": pattern.get("Monday", 0) > 10 or pattern.get("Friday", 0) > 10
        }


class WorkforceAnalytics:

    @staticmethod
    def headcount_by_department(db: Session) -> list:
        """
        Current headcount per department.
        Decision: Hire or redeploy workers.
        """
        rows = (
            db.query(
                Department.name,
                func.count(Employee.id).label("count"),
                func.sum(
                    func.cast(Employee.employment_type == "permanent", int)
                ).label("permanent"),
                func.sum(
                    func.cast(Employee.employment_type == "casual", int)
                ).label("casual")
            )
            .join(Employee, Department.id == Employee.department_id)
            .filter(Employee.is_active == True)
            .group_by(Department.name)
            .all()
        )

        return [
            {
                "department": r.name,
                "total":      r.count,
                "permanent":  int(r.permanent or 0),
                "casual":     int(r.casual or 0)
            }
            for r in rows
        ]

    @staticmethod
    def turnover_report(db: Session, year: int, month: int) -> dict:
        """
        Monthly turnover rate.
        Decision: Flag high-risk departments, improve retention.
        """
        _, last_day = monthrange(year, month)
        start = date(year, month, 1)
        end   = date(year, month, last_day)

        total_employees = db.query(Employee).filter(Employee.is_active == True).count()

        new_hires = db.query(Employee).filter(
            and_(Employee.joined_date >= start, Employee.joined_date <= end)
        ).count()

        resignations = db.query(Employee).filter(
            and_(Employee.resigned_date >= start, Employee.resigned_date <= end)
        ).count()

        turnover_rate = round(
            (resignations / total_employees * 100), 2
        ) if total_employees > 0 else 0

        return {
            "month":            month,
            "year":             year,
            "total_employees":  total_employees,
            "new_hires":        new_hires,
            "resignations":     resignations,
            "turnover_rate":    turnover_rate,
            "alert":            turnover_rate > 5
        }

    @staticmethod
    def employment_type_breakdown(db: Session) -> dict:
        """Permanent vs Contract vs Casual vs Trainee ratio"""
        rows = (
            db.query(Employee.employment_type, func.count(Employee.id))
            .filter(Employee.is_active == True)
            .group_by(Employee.employment_type)
            .all()
        )

        breakdown = {row[0]: row[1] for row in rows}
        total     = sum(breakdown.values())

        return {
            "total": total,
            "breakdown": breakdown,
            "percentages": {
                k: round(v / total * 100, 1) for k, v in breakdown.items()
            } if total > 0 else {}
        }


class PayrollAnalytics:

    @staticmethod
    def labour_cost_by_department(db: Session, run_id: int) -> list:
        """
        Labour cost breakdown per department.
        Decision: Budget control, pricing decisions.
        """
        rows = (
            db.query(
                Department.name.label("department"),
                func.count(Payslip.id).label("employees"),
                func.sum(Payslip.basic_salary).label("total_basic"),
                func.sum(Payslip.ot_amount).label("total_ot"),
                func.sum(
                    Payslip.attendance_allow +
                    Payslip.transport_allow +
                    Payslip.meal_allow
                ).label("total_allowances"),
                func.sum(Payslip.gross_salary).label("total_gross"),
                func.sum(
                    Payslip.epf_employer + Payslip.etf_employer
                ).label("total_epf_etf")
            )
            .join(Employee, Payslip.employee_id == Employee.id)
            .join(Department, Employee.department_id == Department.id)
            .filter(Payslip.payroll_run_id == run_id)
            .group_by(Department.name)
            .all()
        )

        results = []
        for r in rows:
            total_gross = float(r.total_gross or 0)
            employees   = int(r.employees)
            results.append({
                "department":       r.department,
                "total_employees":  employees,
                "total_basic":      float(r.total_basic or 0),
                "total_ot":         float(r.total_ot or 0),
                "total_allowances": float(r.total_allowances or 0),
                "total_gross":      total_gross,
                "total_epf_etf":    float(r.total_epf_etf or 0),
                "cost_per_employee": round(total_gross / employees, 2) if employees > 0 else 0
            })

        return sorted(results, key=lambda x: x["total_gross"], reverse=True)

    @staticmethod
    def payroll_trend(db: Session, months: int = 6) -> list:
        """
        Payroll cost trend over last N months.
        Decision: Budget planning, anomaly detection.
        """
        runs = (
            db.query(PayrollRun)
            .order_by(PayrollRun.year.desc(), PayrollRun.month.desc())
            .limit(months)
            .all()
        )

        trend = []
        for run in runs:
            payslips = db.query(Payslip).filter(
                Payslip.payroll_run_id == run.id
            ).all()

            trend.append({
                "month":       run.month,
                "year":        run.year,
                "period":      f"{run.year}-{str(run.month).zfill(2)}",
                "total_gross": float(sum(p.gross_salary for p in payslips)),
                "total_net":   float(sum(p.net_salary for p in payslips)),
                "total_epf":   float(sum(p.epf_employee + p.epf_employer for p in payslips)),
                "total_etf":   float(sum(p.etf_employer for p in payslips)),
                "headcount":   len(payslips)
            })

        return list(reversed(trend))


class ExecutiveDashboard:

    @staticmethod
    def get_kpis(db: Session) -> dict:
        """
        Real-time KPIs for Director/GM dashboard.
        Triggers alerts when thresholds are breached.
        """
        today      = date.today()
        year       = today.year
        month      = today.month
        _, last_day = monthrange(year, month)

        # ── Attendance Rate (today) ──────────────────────────
        total_employees = db.query(Employee).filter(Employee.is_active == True).count()
        today_present   = db.query(AttendanceLog).filter(
            and_(AttendanceLog.date == today, AttendanceLog.status == AttendanceStatus.PRESENT)
        ).count()
        attendance_rate = round(today_present / total_employees * 100, 2) if total_employees > 0 else 0

        # ── Absenteeism Rate (this month) ────────────────────
        start = date(year, month, 1)
        total_logs = db.query(AttendanceLog).filter(
            AttendanceLog.date >= start
        ).count()
        absent_logs = db.query(AttendanceLog).filter(
            and_(AttendanceLog.date >= start, AttendanceLog.status == AttendanceStatus.ABSENT)
        ).count()
        absenteeism_rate = round(absent_logs / total_logs * 100, 2) if total_logs > 0 else 0

        # ── Turnover Rate (this month) ───────────────────────
        resignations = db.query(Employee).filter(
            and_(
                Employee.resigned_date >= start,
                Employee.resigned_date <= today
            )
        ).count()
        turnover_rate = round(resignations / total_employees * 100, 2) if total_employees > 0 else 0

        # ── OT Hours (this month) ────────────────────────────
        ot_result = db.query(func.sum(AttendanceLog.ot_hours)).filter(
            AttendanceLog.date >= start
        ).scalar()
        total_ot_hours = float(ot_result or 0)

        # ── Pending Leaves ───────────────────────────────────
        pending_leaves = db.query(LeaveRequest).filter(
            LeaveRequest.status == LeaveStatus.PENDING
        ).count()

        # ── Latest Payroll Cost ──────────────────────────────
        latest_run = db.query(PayrollRun).order_by(
            PayrollRun.year.desc(), PayrollRun.month.desc()
        ).first()

        total_labour_cost  = 0
        epf_etf_liability  = 0
        if latest_run:
            payslips = db.query(Payslip).filter(
                Payslip.payroll_run_id == latest_run.id
            ).all()
            total_labour_cost = float(sum(p.gross_salary for p in payslips))
            epf_etf_liability = float(
                sum(p.epf_employee + p.epf_employer + p.etf_employer for p in payslips)
            )

        # ── Alerts ───────────────────────────────────────────
        alerts = []
        if attendance_rate < 90:
            alerts.append({
                "type": "HIGH_ABSENTEEISM",
                "severity": "critical",
                "message": f"Today's attendance rate is {attendance_rate}% — below 90% threshold"
            })
        if turnover_rate > 5:
            alerts.append({
                "type": "HIGH_TURNOVER",
                "severity": "warning",
                "message": f"Monthly turnover rate {turnover_rate}% exceeds 5% threshold"
            })
        if pending_leaves > 10:
            alerts.append({
                "type": "PENDING_LEAVES",
                "severity": "info",
                "message": f"{pending_leaves} leave requests pending approval"
            })
        if absenteeism_rate > 10:
            alerts.append({
                "type": "HIGH_ABSENTEEISM_RATE",
                "severity": "warning",
                "message": f"Monthly absenteeism rate is {absenteeism_rate}%"
            })

        return {
            "as_of":                    str(today),
            "total_active_employees":   total_employees,
            "daily_attendance_rate":    attendance_rate,
            "absenteeism_rate":         absenteeism_rate,
            "monthly_turnover_rate":    turnover_rate,
            "total_ot_hours_month":     total_ot_hours,
            "total_labour_cost_month":  total_labour_cost,
            "epf_etf_liability_month":  epf_etf_liability,
            "pending_leave_requests":   pending_leaves,
            "alerts":                   alerts
        }