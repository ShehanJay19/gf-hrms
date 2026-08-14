from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import hr_manager_only, payroll_only, get_current_user
from app.schemas.payroll import PayrollRunCreate, PayrollRunResponse, PayslipResponse, PayrollSummary
from app.services.payroll_service import PayrollService
from app.models.user import User

router = APIRouter(prefix="/payroll", tags=["Payroll"])

@router.post("/runs", response_model=PayrollRunResponse, status_code=201)
def create_payroll_run(
    data: PayrollRunCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(payroll_only)
):
    """Create a new payroll run for a month"""
    return PayrollService.create_run(db, data, current_user.id)

@router.get("/runs", response_model=list[PayrollRunResponse])
def list_payroll_runs(
    db: Session = Depends(get_db),
    _: User = Depends(hr_manager_only)
):
    return PayrollService.get_all_runs(db)

@router.post("/runs/{run_id}/process")
def process_payroll(
    run_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(payroll_only)
):
    """Calculate all payslips for this payroll run"""
    return PayrollService.process_run(db, run_id)

@router.post("/runs/{run_id}/approve")
def approve_payroll(
    run_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(hr_manager_only)
):
    """Approve a processed payroll run"""
    return PayrollService.approve_run(db, run_id, current_user.id)

@router.get("/runs/{run_id}/summary", response_model=PayrollSummary)
def payroll_summary(
    run_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(hr_manager_only)
):
    """Full payroll summary with all payslips"""
    return PayrollService.get_run_summary(db, run_id)

@router.get("/runs/{run_id}/epf-report")
def epf_etf_report(
    run_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(payroll_only)
):
    """EPF/ETF report for government submission"""
    return PayrollService.get_epf_etf_report(db, run_id)

@router.get("/runs/{run_id}/bank-file")
def bank_transfer_file(
    run_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(payroll_only)
):
    """Bank transfer file for salary payments"""
    return PayrollService.get_bank_file(db, run_id)

@router.get("/runs/{run_id}/payslips/{employee_id}",
            response_model=PayslipResponse)
def get_payslip(
    run_id: int,
    employee_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    """Get individual payslip"""
    return PayrollService.get_employee_payslip(db, run_id, employee_id)
# Add at the bottom of payroll.py
from app.tasks.payroll_tasks import auto_process_payroll

@router.post("/runs/{run_id}/process-async")
def process_payroll_async(
    run_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(payroll_only)
):
    """Process payroll in background (for large employee counts)"""
    task = auto_process_payroll.delay(run_id)
    return {
        "message": "Payroll processing started in background",
        "task_id": task.id
    }

@router.get("/tasks/{task_id}/status")
def get_task_status(
    task_id: str,
    _: User = Depends(get_current_user)
):
    """Check background task status"""
    from app.core.celery_app import celery_app
    task = celery_app.AsyncResult(task_id)
    return {
        "task_id": task_id,
        "status":  task.status,
        "result":  task.result if task.ready() else None
    }