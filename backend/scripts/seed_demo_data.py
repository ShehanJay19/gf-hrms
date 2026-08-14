"""Seed demo data for testing the GF-HRMS app.

Run from the backend folder:

    python scripts/seed_demo_data.py

The script is idempotent: it updates or reuses existing demo rows instead of
creating duplicates.
"""

from __future__ import annotations

import sys
from calendar import monthrange
from datetime import date, time, timedelta
from decimal import Decimal
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.database import Base, SessionLocal, engine
import app.models  # noqa: F401  # Registers SQLAlchemy models for create_all
from app.core.security import hash_password
from app.models.attendance import (
    AttendanceLog,
    AttendanceStatus,
    LeaveBalance,
    LeaveRequest,
    LeaveStatus,
    LeaveType,
    Shift,
)
from app.models.department import Department, Designation, Section
from app.models.employee import Employee, EmploymentType, Gender, MaritalStatus
from app.models.payroll import PayrollRun, PayrollStatus, Payslip
from app.models.user import User, UserRole
from app.main import create_first_admin

MONEY = Decimal("0.01")
DEFAULT_USER_PASSWORD = "Demo@1234"
DEFAULT_ADMIN_PASSWORD = "Admin@2025!"


def money(value: Decimal | int | float | str) -> Decimal:
    return Decimal(str(value)).quantize(MONEY)


def upsert(session, model, lookup: dict, values: dict):
    # If leave_type is part of the lookup, build explicit filters to avoid
    # enum binding issues with filter_by. Normalize enum members to their .value
    if "leave_type" in lookup:
        filters = []
        for k, v in lookup.items():
            if k == "leave_type":
                if hasattr(v, "value"):
                    val = v.value
                else:
                    val = v
                if isinstance(val, str):
                    val = val.lower()
                filters.append(getattr(model, k) == val)
            else:
                filters.append(getattr(model, k) == v)
        instance = session.query(model).filter(*filters).one_or_none()
    else:
        # Normalize enum members in lookup to their .value
        query_lookup = {}
        for k, v in lookup.items():
            if hasattr(v, "value"):
                query_lookup[k] = v.value
            else:
                query_lookup[k] = v
        instance = session.query(model).filter_by(**query_lookup).one_or_none()
    created = instance is None

    if created:
        # Avoid passing the same key twice if lookup and values overlap
        create_kwargs = dict()
        # Start with normalized lookup values
        for k, v in lookup.items():
            if hasattr(v, "value"):
                create_kwargs[k] = v.value
            elif isinstance(v, str) and k == "leave_type":
                create_kwargs[k] = v.lower()
            else:
                create_kwargs[k] = v

        # Add remaining values, converting enum members to their .value when present
        for k, v in values.items():
            if k in create_kwargs:
                continue
            if hasattr(v, "value"):
                create_kwargs[k] = v.value
            else:
                create_kwargs[k] = v
        instance = model(**create_kwargs)
        session.add(instance)
    else:
        for key, value in values.items():
            setattr(instance, key, value)

    session.flush()
    return instance, created


def seed_departments(session):
    departments = [
        ("Cutting", "CUT", "Cutting and fabric preparation unit"),
        ("Sewing", "SEW", "Primary stitching and assembly"),
        ("Finishing", "FIN", "Pressing, packing, and final checks"),
        ("Quality Control", "QC", "Quality inspection and audit team"),
        ("Logistics", "LOG", "Warehouse and dispatch operations"),
    ]

    result = {}
    for name, code, description in departments:
        department, _ = upsert(
            session,
            Department,
            {"code": code},
            {"name": name, "description": description},
        )
        result[code] = department
    return result


def seed_designations(session):
    designations = [
        ("Factory Manager", "M1", 185000),
        ("HR Manager", "M2", 140000),
        ("Payroll Officer", "G2", 115000),
        ("Line Supervisor", "G3", 98000),
        ("Machine Operator", "G5", 72000),
        ("QC Inspector", "G4", 84000),
        ("Logistics Assistant", "G5", 68000),
    ]

    result = {}
    for name, grade, base_salary in designations:
        designation, _ = upsert(
            session,
            Designation,
            {"name": name},
            {"grade": grade, "base_salary": base_salary},
        )
        result[name] = designation
    return result


def seed_sections(session, departments):
    sections = [
        ("Cutting A", "CUT-A", departments["CUT"].id),
        ("Sewing Line A", "SEW-A", departments["SEW"].id),
        ("Sewing Line B", "SEW-B", departments["SEW"].id),
        ("Quality Lab", "QC-LAB", departments["QC"].id),
        ("Logistics Outbound", "LOG-OUT", departments["LOG"].id),
    ]

    result = {}
    for name, code, department_id in sections:
        section, _ = upsert(
            session,
            Section,
            {"code": code},
            {"name": name, "department_id": department_id},
        )
        result[code] = section
    return result


def seed_shifts(session):
    shifts = [
        ("Day Shift", "DAY", time(8, 0), time(17, 0), 10, 8.0, False),
        ("Evening Shift", "EVE", time(14, 0), time(22, 0), 10, 8.0, False),
    ]

    result = {}
    for name, code, start_time, end_time, grace_minutes, ot_starts_after, is_night_shift in shifts:
        shift, _ = upsert(
            session,
            Shift,
            {"code": code},
            {
                "name": name,
                "start_time": start_time,
                "end_time": end_time,
                "grace_minutes": grace_minutes,
                "ot_starts_after": ot_starts_after,
                "is_night_shift": is_night_shift,
            },
        )
        result[code] = shift
    return result


def seed_employees(session, departments, sections, designations):
    employee_rows = [
        {
            "employee_no": "EMP-001",
            "first_name": "John",
            "last_name": "Doe",
            "full_name": "John Doe",
            "nic": "901234567V",
            "date_of_birth": date(1988, 4, 12),
            "gender": Gender.MALE,
            "marital_status": MaritalStatus.MARRIED,
            "mobile": "0771001001",
            "email": "john.doe@garmentfactory.com",
            "address": "Colombo",
            "employment_type": EmploymentType.PERMANENT,
            "joined_date": date(2022, 1, 10),
            "department_id": departments["CUT"].id,
            "section_id": sections["CUT-A"].id,
            "designation_id": designations["Factory Manager"].id,
            "basic_salary": money(185000),
            "bank_name": "Commercial Bank",
            "bank_account_no": "001234567890",
            "bank_branch": "Pettah",
            "epf_no": "EPF001",
            "biometric_id": "BIO-001",
        },
        {
            "employee_no": "EMP-042",
            "first_name": "Sarah",
            "last_name": "Miller",
            "full_name": "Sarah Miller",
            "nic": "921234567V",
            "date_of_birth": date(1990, 7, 22),
            "gender": Gender.FEMALE,
            "marital_status": MaritalStatus.SINGLE,
            "mobile": "0771001002",
            "email": "sarah.miller@garmentfactory.com",
            "address": "Kandy",
            "employment_type": EmploymentType.PERMANENT,
            "joined_date": date(2022, 6, 1),
            "department_id": departments["SEW"].id,
            "section_id": sections["SEW-A"].id,
            "designation_id": designations["HR Manager"].id,
            "basic_salary": money(140000),
            "bank_name": "Hatton National Bank",
            "bank_account_no": "002234567891",
            "bank_branch": "Kandy",
            "epf_no": "EPF042",
            "biometric_id": "BIO-042",
        },
        {
            "employee_no": "EMP-088",
            "first_name": "Amanda",
            "last_name": "Levy",
            "full_name": "Amanda Levy",
            "nic": "881234567V",
            "date_of_birth": date(1992, 11, 4),
            "gender": Gender.FEMALE,
            "marital_status": MaritalStatus.MARRIED,
            "mobile": "0771001003",
            "email": "amanda.levy@garmentfactory.com",
            "address": "Gampaha",
            "employment_type": EmploymentType.PERMANENT,
            "joined_date": date(2021, 9, 15),
            "department_id": departments["LOG"].id,
            "section_id": sections["LOG-OUT"].id,
            "designation_id": designations["Payroll Officer"].id,
            "basic_salary": money(115000),
            "bank_name": "Sampath Bank",
            "bank_account_no": "003234567892",
            "bank_branch": "Gampaha",
            "epf_no": "EPF088",
            "biometric_id": "BIO-088",
        },
        {
            "employee_no": "EMP-115",
            "first_name": "Robert",
            "last_name": "Khan",
            "full_name": "Robert Khan",
            "nic": "861234567V",
            "date_of_birth": date(1987, 2, 28),
            "gender": Gender.MALE,
            "marital_status": MaritalStatus.MARRIED,
            "mobile": "0771001004",
            "email": "robert.khan@garmentfactory.com",
            "address": "Negombo",
            "employment_type": EmploymentType.PERMANENT,
            "joined_date": date(2020, 5, 20),
            "department_id": departments["QC"].id,
            "section_id": sections["QC-LAB"].id,
            "designation_id": designations["Line Supervisor"].id,
            "basic_salary": money(98000),
            "bank_name": "DFCC Bank",
            "bank_account_no": "004234567893",
            "bank_branch": "Negombo",
            "epf_no": "EPF115",
            "biometric_id": "BIO-115",
        },
        {
            "employee_no": "EMP-3092",
            "first_name": "Arjun",
            "last_name": "Sharma",
            "full_name": "Arjun Sharma",
            "nic": "941234567V",
            "date_of_birth": date(1994, 8, 9),
            "gender": Gender.MALE,
            "marital_status": MaritalStatus.SINGLE,
            "mobile": "0771001005",
            "email": "arjun.sharma@garmentfactory.com",
            "address": "Kurunegala",
            "employment_type": EmploymentType.CONTRACT,
            "joined_date": date(2023, 3, 12),
            "department_id": departments["SEW"].id,
            "section_id": sections["SEW-B"].id,
            "designation_id": designations["Machine Operator"].id,
            "basic_salary": money(72000),
            "bank_name": "People's Bank",
            "bank_account_no": "005234567894",
            "bank_branch": "Kurunegala",
            "epf_no": "EPF3092",
            "biometric_id": "BIO-3092",
        },
        {
            "employee_no": "EMP-5120",
            "first_name": "Priya",
            "last_name": "Kapadia",
            "full_name": "Priya Kapadia",
            "nic": "911234567V",
            "date_of_birth": date(1991, 12, 15),
            "gender": Gender.FEMALE,
            "marital_status": MaritalStatus.SINGLE,
            "mobile": "0771001006",
            "email": "priya.kapadia@garmentfactory.com",
            "address": "Matara",
            "employment_type": EmploymentType.PERMANENT,
            "joined_date": date(2022, 11, 8),
            "department_id": departments["QC"].id,
            "section_id": sections["QC-LAB"].id,
            "designation_id": designations["QC Inspector"].id,
            "basic_salary": money(84000),
            "bank_name": "Nations Trust Bank",
            "bank_account_no": "006234567895",
            "bank_branch": "Matara",
            "epf_no": "EPF5120",
            "biometric_id": "BIO-5120",
        },
    ]

    employees = {}
    for row in employee_rows:
        employee, _ = upsert(session, Employee, {"employee_no": row["employee_no"]}, row)
        employees[row["employee_no"]] = employee
    return employees


def seed_users(session, employees):
    admin_password = hash_password(DEFAULT_ADMIN_PASSWORD)
    demo_password = hash_password(DEFAULT_USER_PASSWORD)

    user_rows = [
        {
            "email": "admin@garmentfactory.com",
            "username": "admin",
            "hashed_password": admin_password,
            "role": UserRole.SUPER_ADMIN,
            "employee_id": None,
            "is_verified": True,
        },
        {
            "email": "hrmanager@garmentfactory.com",
            "username": "hrmanager",
            "hashed_password": demo_password,
            "role": UserRole.HR_MANAGER,
            "employee_id": employees["EMP-042"].id,
            "is_verified": True,
        },
        {
            "email": "payroll@garmentfactory.com",
            "username": "payroll",
            "hashed_password": demo_password,
            "role": UserRole.PAYROLL_OFFICER,
            "employee_id": employees["EMP-088"].id,
            "is_verified": True,
        },
        {
            "email": "supervisor@garmentfactory.com",
            "username": "supervisor",
            "hashed_password": demo_password,
            "role": UserRole.LINE_SUPERVISOR,
            "employee_id": employees["EMP-115"].id,
            "is_verified": True,
        },
        {
            "email": "employee@garmentfactory.com",
            "username": "employee",
            "hashed_password": demo_password,
            "role": UserRole.EMPLOYEE,
            "employee_id": employees["EMP-3092"].id,
            "is_verified": True,
        },
    ]

    users = {}
    for row in user_rows:
        user, _ = upsert(session, User, {"email": row["email"]}, row)
        users[row["email"]] = user
    return users


def seed_leave_balances(session, employees, year: int):
    balance_templates = {
        LeaveType.ANNUAL: (14, 4),
        LeaveType.CASUAL: (7, 1),
        LeaveType.MEDICAL: (14, 2),
    }

    for employee in employees.values():
        # Load existing balances for the employee/year to match in Python
        existing = session.query(LeaveBalance).filter(
            LeaveBalance.employee_id == employee.id,
            LeaveBalance.year == year
        ).all()

        for leave_type, (entitled, taken) in balance_templates.items():
            # Try to find an existing balance with matching leave_type (by value)
            found = None
            for b in existing:
                b_type = getattr(b, "leave_type")
                # b_type may be enum or string depending on binding
                if (hasattr(b_type, "value") and b_type.value == leave_type.value) or (isinstance(b_type, str) and b_type == leave_type.value):
                    found = b
                    break

            if found:
                found.entitled = money(entitled)
                found.taken = money(taken)
                found.remaining = money(entitled - taken)
            else:
                newb = LeaveBalance(
                    employee_id=employee.id,
                    year=year,
                    leave_type=leave_type.value,
                    entitled=money(entitled),
                    taken=money(taken),
                    remaining=money(entitled - taken),
                )
                session.add(newb)


def seed_leave_requests(session, employees):
    today = date.today()
    # We'll match existing leave requests by employee and date range and
    # then check leave_type in Python to avoid Enum binding issues.
    req1_start = today + timedelta(days=2)
    req1_end = today + timedelta(days=3)
    existing1 = session.query(LeaveRequest).filter(
        LeaveRequest.employee_id == employees["EMP-3092"].id,
        LeaveRequest.start_date == req1_start,
        LeaveRequest.end_date == req1_end,
    ).all()

    pending_leave = None
    for r in existing1:
        r_type = getattr(r, "leave_type")
        if (hasattr(r_type, "value") and r_type.value == LeaveType.CASUAL.value) or (isinstance(r_type, str) and r_type == LeaveType.CASUAL.value):
            pending_leave = r
            break

    if pending_leave:
        pending_leave.total_days = money(2)
        pending_leave.reason = "Family matter"
        pending_leave.status = LeaveStatus.PENDING
    else:
        pending_leave = LeaveRequest(
            employee_id=employees["EMP-3092"].id,
            leave_type=LeaveType.CASUAL.value,
            start_date=req1_start,
            end_date=req1_end,
            total_days=money(2),
            reason="Family matter",
            status=LeaveStatus.PENDING,
        )
        session.add(pending_leave)

    # Second example: a recently approved medical leave
    req2_start = today - timedelta(days=10)
    req2_end = today - timedelta(days=8)
    existing2 = session.query(LeaveRequest).filter(
        LeaveRequest.employee_id == employees["EMP-115"].id,
        LeaveRequest.start_date == req2_start,
        LeaveRequest.end_date == req2_end,
    ).all()

    found2 = None
    for r in existing2:
        r_type = getattr(r, "leave_type")
        if (hasattr(r_type, "value") and r_type.value == LeaveType.MEDICAL.value) or (isinstance(r_type, str) and r_type == LeaveType.MEDICAL.value):
            found2 = r
            break

    if found2:
        found2.total_days = money(3)
        found2.reason = "Medical rest"
        found2.status = LeaveStatus.APPROVED
        found2.approved_by = employees["EMP-042"].id
        found2.approved_at = today - timedelta(days=11)
    else:
        lr = LeaveRequest(
            employee_id=employees["EMP-115"].id,
            leave_type=LeaveType.MEDICAL.value,
            start_date=req2_start,
            end_date=req2_end,
            total_days=money(3),
            reason="Medical rest",
            status=LeaveStatus.APPROVED,
            approved_by=employees["EMP-042"].id,
            approved_at=today - timedelta(days=11),
        )
        session.add(lr)

    return pending_leave


def seed_payroll_runs(session, users, employees):
    today = date.today()
    current_month_start = date(today.year, today.month, 1)
    current_month_end = date(today.year, today.month, monthrange(today.year, today.month)[1])

    previous_month = today.month - 1 or 12
    previous_year = today.year if today.month > 1 else today.year - 1
    previous_month_start = date(previous_year, previous_month, 1)
    previous_month_end = date(previous_year, previous_month, monthrange(previous_year, previous_month)[1])

    payroll_runs = [
        {
            "month": current_month_start.month,
            "year": current_month_start.year,
            "period_start": current_month_start,
            "period_end": current_month_end,
            "status": PayrollStatus.PAID,
            "processed_by": users["payroll@garmentfactory.com"].id,
            "approved_by": users["admin@garmentfactory.com"].id,
            "notes": "Current month demo payroll run",
        },
        {
            "month": previous_month_start.month,
            "year": previous_month_start.year,
            "period_start": previous_month_start,
            "period_end": previous_month_end,
            "status": PayrollStatus.PENDING,
            "processed_by": users["payroll@garmentfactory.com"].id,
            "approved_by": None,
            "notes": "Previous month demo payroll run",
        },
    ]

    runs = []
    for row in payroll_runs:
        run, _ = upsert(
            session,
            PayrollRun,
            {"month": row["month"], "year": row["year"]},
            row,
        )
        runs.append(run)
    return runs


def build_payslip(employee: Employee, payroll_run: PayrollRun, order_index: int) -> dict:
    salary = Decimal(str(employee.basic_salary or 0))
    allowances = money(2500 + (order_index * 500))
    ot_amount = money(8000 + (order_index * 1250))
    attendance_allow = money(3000)
    transport_allow = money(2000)
    meal_allow = money(1500)
    other_allow = money(500 if order_index % 2 == 0 else 0)
    no_pay_deduct = money(0 if order_index != 3 else 1500)
    loan_deduct = money(0)
    other_deduct = money(0)
    gross_salary = money(salary + ot_amount + attendance_allow + transport_allow + meal_allow + other_allow)
    epf_employee = money(salary * Decimal("0.08"))
    epf_employer = money(salary * Decimal("0.12"))
    etf_employer = money(salary * Decimal("0.03"))
    total_deductions = money(epf_employee + no_pay_deduct + loan_deduct + other_deduct)
    net_salary = money(gross_salary - total_deductions)

    return {
        "payroll_run_id": payroll_run.id,
        "employee_id": employee.id,
        "working_days": 26,
        "present_days": money(24),
        "absent_days": money(1 if order_index % 3 == 0 else 0),
        "no_pay_days": money(1 if order_index % 4 == 0 else 0),
        "ot_hours": money(8 + order_index),
        "basic_salary": money(salary),
        "ot_amount": ot_amount,
        "attendance_allow": attendance_allow,
        "transport_allow": transport_allow,
        "meal_allow": meal_allow,
        "other_allow": other_allow,
        "gross_salary": gross_salary,
        "epf_employee": epf_employee,
        "no_pay_deduct": no_pay_deduct,
        "loan_deduct": loan_deduct,
        "other_deduct": other_deduct,
        "total_deductions": total_deductions,
        "epf_employer": epf_employer,
        "etf_employer": etf_employer,
        "net_salary": net_salary,
        "payslip_url": f"/storage/payslips/{payroll_run.year}-{payroll_run.month}-{employee.employee_no}.pdf",
    }


def seed_payslips(session, payroll_runs, employees):
    ordered_employees = list(employees.values())
    for payroll_run in payroll_runs:
        for index, employee in enumerate(ordered_employees, start=1):
            payslip_data = build_payslip(employee, payroll_run, index)
            upsert(
                session,
                Payslip,
                {
                    "payroll_run_id": payroll_run.id,
                    "employee_id": employee.id,
                },
                payslip_data,
            )


def seed_attendance(session, employees, shifts):
    today = date.today()
    month_start = date(today.year, today.month, 1)
    day_shift = shifts["DAY"]

    attendance_rows = [
        ("EMP-001", 0, time(8, 3), time(17, 20), AttendanceStatus.PRESENT, 0, 0, Decimal("1.25"), Decimal("9.28")),
        ("EMP-042", 0, time(8, 55), time(17, 5), AttendanceStatus.PRESENT, 45, 0, Decimal("0.25"), Decimal("8.17")),
        ("EMP-088", 0, None, None, AttendanceStatus.ABSENT, 0, 0, Decimal("0"), Decimal("0")),
        ("EMP-115", 0, time(8, 12), time(18, 15), AttendanceStatus.PRESENT, 2, 0, Decimal("2.25"), Decimal("10.05")),
        ("EMP-3092", 0, time(8, 8), time(17, 0), AttendanceStatus.PRESENT, 0, 0, Decimal("0.00"), Decimal("8.87")),
        ("EMP-5120", 0, time(8, 20), time(16, 45), AttendanceStatus.ON_LEAVE, 0, 0, Decimal("0.00"), Decimal("8.42")),
        ("EMP-001", 1, time(8, 0), time(17, 30), AttendanceStatus.PRESENT, 0, 0, Decimal("1.50"), Decimal("9.50")),
        ("EMP-042", 1, time(8, 46), time(16, 55), AttendanceStatus.PRESENT, 36, 5, Decimal("0.00"), Decimal("8.15")),
        ("EMP-088", 1, None, None, AttendanceStatus.ABSENT, 0, 0, Decimal("0"), Decimal("0")),
        ("EMP-115", 1, time(8, 6), time(17, 10), AttendanceStatus.PRESENT, 0, 0, Decimal("0.75"), Decimal("9.07")),
        ("EMP-3092", 1, time(8, 18), time(17, 15), AttendanceStatus.PRESENT, 8, 0, Decimal("0.25"), Decimal("8.95")),
        ("EMP-5120", 1, None, None, AttendanceStatus.ON_LEAVE, 0, 0, Decimal("0"), Decimal("0")),
        ("EMP-001", 2, time(8, 4), time(17, 0), AttendanceStatus.PRESENT, 0, 0, Decimal("1.00"), Decimal("8.93")),
        ("EMP-042", 2, time(8, 7), time(17, 25), AttendanceStatus.PRESENT, 0, 0, Decimal("1.10"), Decimal("9.30")),
        ("EMP-088", 2, time(8, 12), time(17, 0), AttendanceStatus.PRESENT, 2, 0, Decimal("0.25"), Decimal("8.80")),
        ("EMP-115", 2, time(8, 10), time(17, 5), AttendanceStatus.PRESENT, 0, 0, Decimal("0.50"), Decimal("8.92")),
        ("EMP-3092", 2, None, None, AttendanceStatus.ABSENT, 0, 0, Decimal("0"), Decimal("0")),
        ("EMP-5120", 2, time(8, 0), time(18, 0), AttendanceStatus.PRESENT, 0, 0, Decimal("2.00"), Decimal("10.00")),
        ("EMP-001", 3, time(8, 1), time(17, 10), AttendanceStatus.PRESENT, 0, 0, Decimal("0.75"), Decimal("9.15")),
        ("EMP-042", 3, time(8, 5), time(17, 2), AttendanceStatus.PRESENT, 0, 0, Decimal("0.30"), Decimal("8.95")),
        ("EMP-088", 3, time(8, 9), time(17, 20), AttendanceStatus.PRESENT, 0, 0, Decimal("1.00"), Decimal("9.18")),
        ("EMP-115", 3, None, None, AttendanceStatus.ABSENT, 0, 0, Decimal("0"), Decimal("0")),
        ("EMP-3092", 3, time(8, 13), time(17, 0), AttendanceStatus.PRESENT, 3, 0, Decimal("0.25"), Decimal("8.78")),
        ("EMP-5120", 3, time(8, 17), time(16, 50), AttendanceStatus.ON_LEAVE, 0, 0, Decimal("0"), Decimal("8.55")),
    ]

    for employee_no, day_offset, check_in, check_out, status, late_minutes, early_out_mins, ot_hours, worked_hours in attendance_rows:
        log_date = month_start + timedelta(days=day_offset)
        employee = employees[employee_no]
        upsert(
            session,
            AttendanceLog,
            {"employee_id": employee.id, "date": log_date},
            {
                "check_in": check_in,
                "check_out": check_out,
                "status": status,
                "shift_id": day_shift.id,
                "late_minutes": late_minutes,
                "early_out_mins": early_out_mins,
                "ot_hours": ot_hours,
                "worked_hours": worked_hours,
                "is_manual": True,
                "notes": "Seeded demo attendance",
            },
        )


def main():
    Base.metadata.create_all(bind=engine)

    create_first_admin()

    session = SessionLocal()
    try:
        departments = seed_departments(session)
        designations = seed_designations(session)
        sections = seed_sections(session, departments)
        shifts = seed_shifts(session)
        employees = seed_employees(session, departments, sections, designations)
        users = seed_users(session, employees)
        # Skip leave balances/requests to avoid enum mapping issues in some DB setups
        # seed_leave_balances(session, employees, date.today().year)
        # seed_leave_requests(session, employees)
        payroll_runs = seed_payroll_runs(session, users, employees)
        seed_payslips(session, payroll_runs, employees)
        # Skip seeding attendance to avoid enum mapping issues in some DB setups
        # seed_attendance(session, employees, shifts)
        session.commit()

        print("Demo data seeded successfully.")
        print(f"Departments: {len(departments)}")
        print(f"Designations: {len(designations)}")
        print(f"Sections: {len(sections)}")
        print(f"Shifts: {len(shifts)}")
        print(f"Employees: {len(employees)}")
        print(f"Users: {len(users)}")
        print(f"Payroll runs: {len(payroll_runs)}")
        print(f"Payslips: {len(payroll_runs) * len(employees)}")
        print("Login as: admin@garmentfactory.com / Admin@2025!")
        print("Or demo users with password: Demo@1234")
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


if __name__ == "__main__":
    main()
