from pydantic import BaseModel
from typing import Optional
from datetime import date
from decimal import Decimal
from app.models.payroll import PayrollStatus

class PayrollRunCreate(BaseModel):
    month: int
    year: int
    notes: Optional[str] = None

class PayrollRunResponse(BaseModel):
    id: int
    month: int
    year: int
    period_start: date
    period_end: date
    status: PayrollStatus
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class PayslipResponse(BaseModel):
    id: int
    employee_id: int
    payroll_run_id: int

    # Working days
    working_days: int
    present_days: Decimal
    absent_days: Decimal
    no_pay_days: Decimal
    ot_hours: Decimal

    # Earnings
    basic_salary: Decimal
    ot_amount: Decimal
    attendance_allow: Decimal
    transport_allow: Decimal
    meal_allow: Decimal
    other_allow: Decimal
    gross_salary: Decimal

    # Deductions
    epf_employee: Decimal
    no_pay_deduct: Decimal
    loan_deduct: Decimal
    other_deduct: Decimal
    total_deductions: Decimal

    # Employer
    epf_employer: Decimal
    etf_employer: Decimal

    # Net
    net_salary: Decimal

    class Config:
        from_attributes = True

class PayrollSummary(BaseModel):
    payroll_run_id: int
    month: int
    year: int
    total_employees: int
    total_gross: Decimal
    total_epf_employee: Decimal
    total_epf_employer: Decimal
    total_etf: Decimal
    total_net: Decimal
    total_ot_cost: Decimal
    status: PayrollStatus
    payslips: list[PayslipResponse]