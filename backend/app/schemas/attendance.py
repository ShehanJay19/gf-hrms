from pydantic import BaseModel
from typing import Optional
from datetime import date, time
from decimal import Decimal
from app.models.attendance import AttendanceStatus, LeaveType, LeaveStatus

class ShiftCreate(BaseModel):
    name: str
    code: str
    start_time: time
    end_time: time
    grace_minutes: int = 10
    ot_starts_after: Decimal = Decimal("8.0")
    is_night_shift: bool = False

class ShiftResponse(BaseModel):
    id: int
    name: str
    code: str
    start_time: time
    end_time: time
    grace_minutes: int
    ot_starts_after: Decimal
    is_night_shift: bool
    is_active: bool

    class Config:
        from_attributes = True

class ManualAttendanceCreate(BaseModel):
    employee_id: int
    date: date
    check_in: Optional[time] = None
    check_out: Optional[time] = None
    shift_id: Optional[int] = None
    notes: Optional[str] = None

class BiometricLogCreate(BaseModel):
    """Payload pushed from biometric device"""
    biometric_id: str       # Device finger ID
    timestamp: str          # "2025-01-15 08:05:00"
    device_id: Optional[str] = None

class AttendanceResponse(BaseModel):
    id: int
    employee_id: int
    date: date
    check_in: Optional[time] = None
    check_out: Optional[time] = None
    status: AttendanceStatus
    late_minutes: int
    early_out_mins: int
    ot_hours: Decimal
    worked_hours: Decimal
    is_manual: bool
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class AttendanceSummary(BaseModel):
    employee_id: int
    employee_no: str
    full_name: str
    present_days: int
    absent_days: int
    late_days: int
    total_ot_hours: Decimal
    attendance_rate: float

class LeaveRequestCreate(BaseModel):
    employee_id: int
    leave_type: LeaveType
    start_date: date
    end_date: date
    reason: Optional[str] = None

class LeaveRequestResponse(BaseModel):
    id: int
    employee_id: int
    leave_type: LeaveType
    start_date: date
    end_date: date
    total_days: Decimal
    reason: Optional[str] = None
    status: LeaveStatus
    approved_by: Optional[int] = None
    reject_reason: Optional[str] = None

    class Config:
        from_attributes = True

class LeaveApproval(BaseModel):
    status: LeaveStatus     # approved or rejected
    reject_reason: Optional[str] = None

class DailyAttendanceReport(BaseModel):
    date: date
    total_employees: int
    present: int
    absent: int
    on_leave: int
    attendance_rate: float
    records: list[AttendanceResponse]