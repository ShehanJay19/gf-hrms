from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import date

from app.core.database import get_db
from app.core.dependencies import get_current_user, hr_manager_only
from app.services.analytics_service import (
    AttendanceAnalytics, WorkforceAnalytics,
    PayrollAnalytics, ExecutiveDashboard
)
from app.models.user import User

router = APIRouter(prefix="/reports", tags=["Analytics & Reports"])

# ── EXECUTIVE DASHBOARD ────────────────────────────────────
@router.get("/dashboard/kpis")
def executive_kpis(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    """Real-time KPIs for executive dashboard with alerts"""
    return ExecutiveDashboard.get_kpis(db)

# ── ATTENDANCE REPORTS ─────────────────────────────────────
@router.get("/attendance/absenteeism")
def absenteeism_report(
    year:  int = Query(default=date.today().year),
    month: int = Query(default=date.today().month, ge=1, le=12),
    db: Session = Depends(get_db),
    _: User = Depends(hr_manager_only)
):
    """Absenteeism rate per department — triggers staffing decisions"""
    return AttendanceAnalytics.absenteeism_report(db, year, month)

@router.get("/attendance/late-arrivals")
def late_arrival_report(
    year:  int = Query(default=date.today().year),
    month: int = Query(default=date.today().month, ge=1, le=12),
    db: Session = Depends(get_db),
    _: User = Depends(hr_manager_only)
):
    """Late arrival frequency per employee"""
    return AttendanceAnalytics.late_arrival_report(db, year, month)

@router.get("/attendance/ot-analysis")
def ot_analysis(
    year:  int = Query(default=date.today().year),
    month: int = Query(default=date.today().month, ge=1, le=12),
    db: Session = Depends(get_db),
    _: User = Depends(hr_manager_only)
):
    """OT hours and cost analysis by employee and department"""
    return AttendanceAnalytics.ot_analysis(db, year, month)

@router.get("/attendance/weekday-pattern")
def weekday_pattern(
    year:  int = Query(default=date.today().year),
    month: int = Query(default=date.today().month, ge=1, le=12),
    db: Session = Depends(get_db),
    _: User = Depends(hr_manager_only)
):
    """Monday/Friday absenteeism pattern detection"""
    return AttendanceAnalytics.monday_friday_pattern(db, year, month)

# ── WORKFORCE REPORTS ──────────────────────────────────────
@router.get("/workforce/headcount")
def headcount_report(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    """Headcount by department — permanent vs casual breakdown"""
    return WorkforceAnalytics.headcount_by_department(db)

@router.get("/workforce/turnover")
def turnover_report(
    year:  int = Query(default=date.today().year),
    month: int = Query(default=date.today().month, ge=1, le=12),
    db: Session = Depends(get_db),
    _: User = Depends(hr_manager_only)
):
    """Monthly turnover rate with alert if > 5%"""
    return WorkforceAnalytics.turnover_report(db, year, month)

@router.get("/workforce/employment-types")
def employment_breakdown(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    """Permanent vs Contract vs Casual vs Trainee ratio"""
    return WorkforceAnalytics.employment_type_breakdown(db)

# ── PAYROLL REPORTS ────────────────────────────────────────
@router.get("/payroll/labour-cost/{run_id}")
def labour_cost_report(
    run_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(hr_manager_only)
):
    """Labour cost breakdown per department for a payroll run"""
    return PayrollAnalytics.labour_cost_by_department(db, run_id)

@router.get("/payroll/trend")
def payroll_trend(
    months: int = Query(default=6, ge=1, le=24),
    db: Session = Depends(get_db),
    _: User = Depends(hr_manager_only)
):
    """Payroll cost trend over last N months"""
    return PayrollAnalytics.payroll_trend(db, months)