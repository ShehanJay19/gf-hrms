from sqlalchemy import Column, String, Integer, ForeignKey, Date, Time, Enum, Text, Numeric, Boolean
from sqlalchemy.orm import relationship
import enum
from app.models.base import BaseModel

class AttendanceStatus(str, enum.Enum):
    PRESENT     = "present"
    ABSENT      = "absent"
    HALF_DAY    = "half_day"
    ON_LEAVE    = "on_leave"
    HOLIDAY     = "holiday"
    OFF_DAY     = "off_day"

class LeaveType(str, enum.Enum):
    ANNUAL      = "annual"
    CASUAL      = "casual"
    MEDICAL     = "medical"
    MATERNITY   = "maternity"
    NO_PAY      = "no_pay"
    OTHER       = "other"

class LeaveStatus(str, enum.Enum):
    PENDING     = "pending"
    APPROVED    = "approved"
    REJECTED    = "rejected"
    CANCELLED   = "cancelled"

class AttendanceLog(BaseModel):
    __tablename__ = "attendance_logs"

    employee_id     = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    date            = Column(Date, nullable=False, index=True)
    check_in        = Column(Time, nullable=True)
    check_out       = Column(Time, nullable=True)
    status          = Column(Enum(AttendanceStatus), default=AttendanceStatus.ABSENT)
    shift_id        = Column(Integer, ForeignKey("shifts.id"), nullable=True)

    # Computed fields (calculated by the attendance engine)
    late_minutes    = Column(Integer, default=0)
    early_out_mins  = Column(Integer, default=0)
    ot_hours        = Column(Numeric(5, 2), default=0)      # Overtime hours
    worked_hours    = Column(Numeric(5, 2), default=0)
    is_manual       = Column(Boolean, default=False)         # Manually entered?
    notes           = Column(Text, nullable=True)

    # Relationships
    employee = relationship("Employee", back_populates="attendances")
    shift    = relationship("Shift")


class Shift(BaseModel):
    __tablename__ = "shifts"

    name            = Column(String(100), nullable=False)   # e.g. "Day Shift", "Night Shift"
    code            = Column(String(20), nullable=False)
    start_time      = Column(Time, nullable=False)
    end_time        = Column(Time, nullable=False)
    grace_minutes   = Column(Integer, default=10)           # Late tolerance
    ot_starts_after = Column(Numeric(4, 2), default=8.0)   # OT after 8 worked hours
    is_night_shift  = Column(Boolean, default=False)


class LeaveRequest(BaseModel):
    __tablename__ = "leave_requests"

    employee_id   = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    leave_type    = Column(Enum(LeaveType), nullable=False)
    start_date    = Column(Date, nullable=False)
    end_date      = Column(Date, nullable=False)
    total_days    = Column(Numeric(4, 1), nullable=False)
    reason        = Column(Text, nullable=True)
    status        = Column(Enum(LeaveStatus), default=LeaveStatus.PENDING)
    approved_by   = Column(Integer, ForeignKey("employees.id"), nullable=True)
    approved_at   = Column(Date, nullable=True)
    reject_reason = Column(Text, nullable=True)

    employee = relationship("Employee", back_populates="leaves",
                            foreign_keys=[employee_id])


class LeaveBalance(BaseModel):
    __tablename__ = "leave_balances"

    employee_id   = Column(Integer, ForeignKey("employees.id"), nullable=False)
    year          = Column(Integer, nullable=False)
    leave_type    = Column(Enum(LeaveType), nullable=False)
    entitled      = Column(Numeric(4, 1), default=0)
    taken         = Column(Numeric(4, 1), default=0)
    remaining     = Column(Numeric(4, 1), default=0)