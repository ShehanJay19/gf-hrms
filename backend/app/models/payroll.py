from sqlalchemy import Column, String, Integer, ForeignKey, Date, Enum, Text, Numeric
from sqlalchemy.orm import relationship
import enum
from app.models.base import BaseModel

class PayrollStatus(str, enum.Enum):
    DRAFT     = "draft"
    PENDING   = "pending"
    APPROVED  = "approved"
    PAID      = "paid"
    CANCELLED = "cancelled"

class PayrollRun(BaseModel):
    """One payroll run per month"""
    __tablename__ = "payroll_runs"

    month         = Column(Integer, nullable=False)        # 1-12
    year          = Column(Integer, nullable=False)
    period_start  = Column(Date, nullable=False)
    period_end    = Column(Date, nullable=False)
    status        = Column(
        Enum(
            PayrollStatus,
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
            name="payrollstatus",
        ),
        default=PayrollStatus.DRAFT,
    )
    processed_by  = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_by   = Column(Integer, ForeignKey("users.id"), nullable=True)
    notes         = Column(Text, nullable=True)

    payslips = relationship("Payslip", back_populates="payroll_run")


class Payslip(BaseModel):
    """Individual payslip per employee per month"""
    __tablename__ = "payslips"

    payroll_run_id   = Column(Integer, ForeignKey("payroll_runs.id"), nullable=False)
    employee_id      = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)

    # Working days
    working_days     = Column(Integer, default=0)
    present_days     = Column(Numeric(4, 1), default=0)
    absent_days      = Column(Numeric(4, 1), default=0)
    no_pay_days      = Column(Numeric(4, 1), default=0)
    ot_hours         = Column(Numeric(6, 2), default=0)

    # Earnings
    basic_salary     = Column(Numeric(12, 2), default=0)
    ot_amount        = Column(Numeric(12, 2), default=0)
    attendance_allow = Column(Numeric(12, 2), default=0)
    transport_allow  = Column(Numeric(12, 2), default=0)
    meal_allow       = Column(Numeric(12, 2), default=0)
    other_allow      = Column(Numeric(12, 2), default=0)
    gross_salary     = Column(Numeric(12, 2), default=0)

    # Deductions
    epf_employee     = Column(Numeric(12, 2), default=0)   # 8%
    no_pay_deduct    = Column(Numeric(12, 2), default=0)
    loan_deduct      = Column(Numeric(12, 2), default=0)
    other_deduct     = Column(Numeric(12, 2), default=0)
    total_deductions = Column(Numeric(12, 2), default=0)

    # Employer contributions
    epf_employer     = Column(Numeric(12, 2), default=0)   # 12%
    etf_employer     = Column(Numeric(12, 2), default=0)   # 3%

    # Net
    net_salary       = Column(Numeric(12, 2), default=0)
    payslip_url      = Column(String(500), nullable=True)  # PDF location in MinIO

    payroll_run = relationship("PayrollRun", back_populates="payslips")
    employee    = relationship("Employee", back_populates="payslips")


class Allowance(BaseModel):
    __tablename__ = "allowances"

    name       = Column(String(100), nullable=False)
    amount     = Column(Numeric(12, 2), nullable=False)
    is_taxable = Column(String(5), default="no")