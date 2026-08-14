from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import date

from app.core.database import get_db
from app.core.dependencies import hr_manager_only, payroll_only, get_current_user
from app.utils.excel_exporter import (
    generate_payroll_register,
    generate_epf_etf_excel,
    generate_attendance_excel
)
from app.utils.pdf_generator import generate_payslip_pdf
from app.models.user import User

router = APIRouter(prefix="/exports", tags=["Exports"])


@router.get("/payroll/{run_id}/excel")
def export_payroll_excel(
    run_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(payroll_only)
):
    """Download payroll register as Excel file"""
    output = generate_payroll_register(db, run_id)
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=payroll_register_{run_id}.xlsx"}
    )


@router.get("/payroll/{run_id}/epf-excel")
def export_epf_excel(
    run_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(payroll_only)
):
    """Download EPF/ETF report as Excel"""
    output = generate_epf_etf_excel(db, run_id)
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=epf_etf_report_{run_id}.xlsx"}
    )


@router.get("/attendance/{year}/{month}/excel")
def export_attendance_excel(
    year:  int,
    month: int,
    db: Session = Depends(get_db),
    _: User = Depends(hr_manager_only)
):
    """Download monthly attendance report as Excel"""
    output = generate_attendance_excel(db, year, month)
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=attendance_{year}_{month}.xlsx"}
    )


@router.get("/payslip/{run_id}/{employee_id}/pdf")
def export_payslip_pdf(
    run_id: int,
    employee_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    """Download individual payslip as PDF"""
    output = generate_payslip_pdf(db, run_id, employee_id)
    return StreamingResponse(
        output,
        media_type="application/pdf",
        headers={
            "Content-Disposition":
                f"attachment; filename=payslip_{run_id}_{employee_id}.pdf"
        }
    )