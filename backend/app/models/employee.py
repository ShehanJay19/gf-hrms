from sqlalchemy import Column, String, Integer, ForeignKey, Date, Enum, Text, Numeric
from sqlalchemy.orm import relationship
import enum
from app.models.base import BaseModel

class EmploymentType(str, enum.Enum):
    PERMANENT  = "permanent"
    CONTRACT   = "contract"
    CASUAL     = "casual"
    TRAINEE    = "trainee"

class Gender(str, enum.Enum):
    MALE   = "male"
    FEMALE = "female"
    OTHER  = "other"

class MaritalStatus(str, enum.Enum):
    SINGLE   = "single"
    MARRIED  = "married"
    DIVORCED = "divorced"
    WIDOWED  = "widowed"

class Employee(BaseModel):
    __tablename__ = "employees"

    # Personal Info
    employee_no    = Column(String(20), unique=True, nullable=False, index=True)
    first_name     = Column(String(100), nullable=False)
    last_name      = Column(String(100), nullable=False)
    full_name      = Column(String(200), nullable=False)
    nic            = Column(String(20), unique=True, nullable=False)
    date_of_birth  = Column(Date, nullable=False)
    gender         = Column(Enum(Gender), nullable=False)
    marital_status = Column(Enum(MaritalStatus), nullable=True)
    photo_url      = Column(String(500), nullable=True)

    # Contact
    mobile        = Column(String(20), nullable=True)
    email         = Column(String(150), nullable=True)
    address       = Column(Text, nullable=True)
    emergency_name = Column(String(200), nullable=True)
    emergency_tel  = Column(String(20), nullable=True)

    # Employment
    employment_type  = Column(Enum(EmploymentType), nullable=False, default=EmploymentType.PERMANENT)
    joined_date      = Column(Date, nullable=False)
    probation_end    = Column(Date, nullable=True)
    resigned_date    = Column(Date, nullable=True)
    department_id    = Column(Integer, ForeignKey("departments.id"), nullable=True)
    section_id       = Column(Integer, ForeignKey("sections.id"), nullable=True)
    designation_id   = Column(Integer, ForeignKey("designations.id"), nullable=True)
    reporting_to     = Column(Integer, ForeignKey("employees.id"), nullable=True)

    # Salary
    basic_salary     = Column(Numeric(12, 2), nullable=False, default=0)
    bank_name        = Column(String(100), nullable=True)
    bank_account_no  = Column(String(50), nullable=True)
    bank_branch      = Column(String(100), nullable=True)
    epf_no           = Column(String(50), nullable=True)

    # Biometric
    biometric_id     = Column(String(50), nullable=True, unique=True)  # Device finger ID

    # Relationships
    department  = relationship("Department", back_populates="employees",
                               foreign_keys=[department_id])
    section     = relationship("Section", back_populates="employees")
    designation = relationship("Designation", back_populates="employees")
    attendances = relationship("AttendanceLog", back_populates="employee")
    leaves      = relationship(
        "LeaveRequest",
        back_populates="employee",
        foreign_keys="LeaveRequest.employee_id",
    )
    approved_leaves = relationship(
        "LeaveRequest",
        back_populates="approver",
        foreign_keys="LeaveRequest.approved_by",
    )
    payslips    = relationship("Payslip", back_populates="employee")