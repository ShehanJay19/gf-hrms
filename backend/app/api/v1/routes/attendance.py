from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import date
from typing import Optional

from app.core.database import get_db
from app.core.dependencies import get_current_user, hr_manager_only, supervisor_and_above
from app.schemas.attendance import (
    ShiftCreate, ShiftResponse,
    ManualAttendanceCreate, BiometricLogCreate, AttendanceResponse,
    LeaveRequestCreate, LeaveRequestResponse, LeaveApproval,
    DailyAttendanceReport, EmployeeAttendanceHistory
)
from app.services.attendance_service import AttendanceService, LeaveService, ShiftService
from app.models.user import User

router       = APIRouter(prefix="/attendance", tags=["Attendance"])
leave_router = APIRouter(prefix="/leaves", tags=["Leaves"])
shift_router = APIRouter(prefix="/shifts", tags=["Shifts"])

# ── SHIFT ROUTES ───────────────────────────────────────────
@shift_router.post("", response_model=ShiftResponse, status_code=201)
def create_shift(
    data: ShiftCreate,
    db: Session = Depends(get_db),
    _: User = Depends(hr_manager_only)
):
    return ShiftService.create(db, data)

@shift_router.get("", response_model=list[ShiftResponse])
def list_shifts(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    return ShiftService.get_all(db)

# ── ATTENDANCE ROUTES ──────────────────────────────────────
@router.post("/manual", response_model=AttendanceResponse, status_code=201)
def manual_entry(
    data: ManualAttendanceCreate,
    db: Session = Depends(get_db),
    _: User = Depends(supervisor_and_above)
):
    """Supervisors can manually enter attendance"""
    return AttendanceService.manual_entry(db, data)

@router.post("/biometric", status_code=201)
def biometric_punch(
    data: BiometricLogCreate,
    db: Session = Depends(get_db)
):
    """
    Endpoint called by biometric device.
    No auth required — device uses internal network only.
    """
    return AttendanceService.biometric_punch(db, data)

@router.get("/daily", response_model=DailyAttendanceReport)
def daily_report(
    report_date: date = Query(default=date.today()),
    db: Session = Depends(get_db),
    _: User = Depends(supervisor_and_above)
):
    """Daily attendance report for all employees"""
    return AttendanceService.get_daily_report(db, report_date)

@router.get("/monthly-summary")
def monthly_summary(
    year: int  = Query(default=date.today().year),
    month: int = Query(default=date.today().month, ge=1, le=12),
    db: Session = Depends(get_db),
    _: User = Depends(hr_manager_only)
):
    """Monthly attendance summary — used for payroll processing"""
    return AttendanceService.get_monthly_summary(db, year, month)

@router.get("/employee/{employee_id}", response_model=EmployeeAttendanceHistory)
def employee_attendance(
    employee_id: int,
    start_date: date = Query(...),
    end_date: date   = Query(...),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    """Attendance history for a specific employee"""
    return AttendanceService.get_employee_attendance(db, employee_id, start_date, end_date)

# ── LEAVE ROUTES ───────────────────────────────────────────
@leave_router.post("", response_model=LeaveRequestResponse, status_code=201)
def apply_leave(
    data: LeaveRequestCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    return LeaveService.apply(db, data)

@leave_router.get("/pending", response_model=list[LeaveRequestResponse])
def pending_leaves(
    db: Session = Depends(get_db),
    _: User = Depends(supervisor_and_above)
):
    return LeaveService.get_pending(db)

@leave_router.get("/employee/{employee_id}", response_model=list[LeaveRequestResponse])
def employee_leaves(
    employee_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    return LeaveService.get_employee_leaves(db, employee_id)

@leave_router.put("/{leave_id}/approve", response_model=LeaveRequestResponse)
def approve_leave(
    leave_id: int,
    data: LeaveApproval,
    db: Session = Depends(get_db),
    current_user: User = Depends(supervisor_and_above)
):
    return LeaveService.approve_reject(db, leave_id, data, current_user.id)

@leave_router.post("/initialize/{employee_id}")
def init_leave_balance(
    employee_id: int,
    year: int = Query(default=date.today().year),
    db: Session = Depends(get_db),
    _: User = Depends(hr_manager_only)
):
    """Initialize annual leave balances for an employee"""
    LeaveService.initialize_leave_balance(db, employee_id, year)
    return {"message": f"Leave balances initialized for employee {employee_id} — {year}"}