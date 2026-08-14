from sqlalchemy import Column, String, Integer, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
import enum
from app.models.base import BaseModel

class UserRole(str, enum.Enum):
    SUPER_ADMIN    = "super_admin"
    HR_MANAGER     = "hr_manager"
    PAYROLL_OFFICER = "payroll_officer"
    LINE_SUPERVISOR = "line_supervisor"
    FINANCE_MANAGER = "finance_manager"
    EMPLOYEE       = "employee"

class User(BaseModel):
    __tablename__ = "users"

    email       = Column(String(150), unique=True, nullable=False, index=True)
    username    = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role        = Column(
        Enum(
            UserRole,
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
            name="userrole",
        ),
        nullable=False,
        default=UserRole.EMPLOYEE,
    )
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    is_verified = Column(Boolean, default=False)
    last_login  = Column(String(50), nullable=True)

    employee = relationship("Employee")