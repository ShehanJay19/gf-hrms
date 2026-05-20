from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.dependencies import get_current_user, hr_manager_only
from app.schemas.employee import (
    EmployeeCreate, EmployeeUpdate, EmployeeResponse, EmployeeListResponse,
    DepartmentCreate, DepartmentResponse,
    SectionCreate, SectionResponse,
    DesignationCreate, DesignationResponse
)
from app.services.employee_service import (
    EmployeeService, DepartmentService, SectionService, DesignationService
)
from app.models.user import User

router = APIRouter(prefix="/employees", tags=["Employees"])
dept_router   = APIRouter(prefix="/departments", tags=["Departments"])
section_router = APIRouter(prefix="/sections", tags=["Sections"])
desig_router  = APIRouter(prefix="/designations", tags=["Designations"])

# ── DEPARTMENT ROUTES ──────────────────────────────────────
@dept_router.post("", response_model=DepartmentResponse, status_code=201)
def create_department(
    data: DepartmentCreate,
    db: Session = Depends(get_db),
    _: User = Depends(hr_manager_only)
):
    return DepartmentService.create(db, data)

@dept_router.get("", response_model=list[DepartmentResponse])
def list_departments(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    return DepartmentService.get_all(db)

@dept_router.get("/{dept_id}", response_model=DepartmentResponse)
def get_department(
    dept_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    return DepartmentService.get_by_id(db, dept_id)

# ── SECTION ROUTES ─────────────────────────────────────────
@section_router.post("", response_model=SectionResponse, status_code=201)
def create_section(
    data: SectionCreate,
    db: Session = Depends(get_db),
    _: User = Depends(hr_manager_only)
):
    return SectionService.create(db, data)

@section_router.get("", response_model=list[SectionResponse])
def list_sections(
    department_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    return SectionService.get_all(db, department_id)

# ── DESIGNATION ROUTES ─────────────────────────────────────
@desig_router.post("", response_model=DesignationResponse, status_code=201)
def create_designation(
    data: DesignationCreate,
    db: Session = Depends(get_db),
    _: User = Depends(hr_manager_only)
):
    return DesignationService.create(db, data)

@desig_router.get("", response_model=list[DesignationResponse])
def list_designations(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    return DesignationService.get_all(db)

# ── EMPLOYEE ROUTES ────────────────────────────────────────
@router.post("", status_code=201)
def create_employee(
    data: EmployeeCreate,
    db: Session = Depends(get_db),
    _: User = Depends(hr_manager_only)
):
    return EmployeeService.create(db, data)

@router.get("")
def list_employees(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: Optional[str] = Query(None),
    department_id: Optional[int] = Query(None),
    employment_type: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(True),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    return EmployeeService.get_all(db, skip, limit, search, department_id, employment_type, is_active)

@router.get("/headcount")
def headcount_summary(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    return EmployeeService.get_headcount_summary(db)

@router.get("/{employee_id}", response_model=EmployeeResponse)
def get_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    return EmployeeService.get_by_id(db, employee_id)

@router.put("/{employee_id}", response_model=EmployeeResponse)
def update_employee(
    employee_id: int,
    data: EmployeeUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(hr_manager_only)
):
    return EmployeeService.update(db, employee_id, data)

@router.delete("/{employee_id}")
def deactivate_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(hr_manager_only)
):
    return EmployeeService.deactivate(db, employee_id)