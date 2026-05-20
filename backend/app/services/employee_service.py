from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from fastapi import HTTPException, status
from typing import Optional
from app.models.employee import Employee
from app.models.department import Department, Section, Designation
from app.schemas.employee import (
    EmployeeCreate, EmployeeUpdate,
    DepartmentCreate, SectionCreate, DesignationCreate
)

class DepartmentService:

    @staticmethod
    def create(db: Session, data: DepartmentCreate) -> Department:
        existing = db.query(Department).filter(
            (Department.name == data.name) | (Department.code == data.code)
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Department name or code already exists")
        dept = Department(**data.model_dump())
        db.add(dept)
        db.commit()
        db.refresh(dept)
        return dept

    @staticmethod
    def get_all(db: Session) -> list[Department]:
        return db.query(Department).filter(Department.is_active == True).all()

    @staticmethod
    def get_by_id(db: Session, dept_id: int) -> Department:
        dept = db.query(Department).filter(Department.id == dept_id).first()
        if not dept:
            raise HTTPException(status_code=404, detail="Department not found")
        return dept


class SectionService:

    @staticmethod
    def create(db: Session, data: SectionCreate) -> Section:
        # Verify department exists
        DepartmentService.get_by_id(db, data.department_id)
        section = Section(**data.model_dump())
        db.add(section)
        db.commit()
        db.refresh(section)
        return section

    @staticmethod
    def get_all(db: Session, department_id: Optional[int] = None) -> list[Section]:
        query = db.query(Section).filter(Section.is_active == True)
        if department_id:
            query = query.filter(Section.department_id == department_id)
        return query.all()


class DesignationService:

    @staticmethod
    def create(db: Session, data: DesignationCreate) -> Designation:
        existing = db.query(Designation).filter(Designation.name == data.name).first()
        if existing:
            raise HTTPException(status_code=400, detail="Designation already exists")
        desig = Designation(**data.model_dump())
        db.add(desig)
        db.commit()
        db.refresh(desig)
        return desig

    @staticmethod
    def get_all(db: Session) -> list[Designation]:
        return db.query(Designation).filter(Designation.is_active == True).all()


class EmployeeService:

    @staticmethod
    def create(db: Session, data: EmployeeCreate) -> Employee:
        # Check unique fields
        if db.query(Employee).filter(Employee.employee_no == data.employee_no).first():
            raise HTTPException(status_code=400, detail="Employee number already exists")
        if db.query(Employee).filter(Employee.nic == data.nic).first():
            raise HTTPException(status_code=400, detail="NIC already registered")
        if data.biometric_id and db.query(Employee).filter(
            Employee.biometric_id == data.biometric_id).first():
            raise HTTPException(status_code=400, detail="Biometric ID already assigned")

        employee = Employee(
            **data.model_dump(),
            full_name=f"{data.first_name} {data.last_name}"
        )
        db.add(employee)
        db.commit()
        db.refresh(employee)
        return employee

    @staticmethod
    def get_all(
        db: Session,
        skip: int = 0,
        limit: int = 50,
        search: Optional[str] = None,
        department_id: Optional[int] = None,
        employment_type: Optional[str] = None,
        is_active: Optional[bool] = True
    ) -> dict:
        query = db.query(Employee).options(
            joinedload(Employee.department),
            joinedload(Employee.designation)
        )

        if is_active is not None:
            query = query.filter(Employee.is_active == is_active)

        if search:
            query = query.filter(or_(
                Employee.full_name.ilike(f"%{search}%"),
                Employee.employee_no.ilike(f"%{search}%"),
                Employee.nic.ilike(f"%{search}%"),
            ))

        if department_id:
            query = query.filter(Employee.department_id == department_id)

        if employment_type:
            query = query.filter(Employee.employment_type == employment_type)

        total = query.count()
        employees = query.offset(skip).limit(limit).all()

        return {"total": total, "employees": employees}

    @staticmethod
    def get_by_id(db: Session, employee_id: int) -> Employee:
        employee = db.query(Employee).options(
            joinedload(Employee.department),
            joinedload(Employee.section),
            joinedload(Employee.designation)
        ).filter(Employee.id == employee_id).first()

        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")
        return employee

    @staticmethod
    def update(db: Session, employee_id: int, data: EmployeeUpdate) -> Employee:
        employee = EmployeeService.get_by_id(db, employee_id)
        update_data = data.model_dump(exclude_unset=True)

        # Update full_name if name changed
        if "first_name" in update_data or "last_name" in update_data:
            first = update_data.get("first_name", employee.first_name)
            last  = update_data.get("last_name", employee.last_name)
            update_data["full_name"] = f"{first} {last}"

        for field, value in update_data.items():
            setattr(employee, field, value)

        db.commit()
        db.refresh(employee)
        return employee

    @staticmethod
    def deactivate(db: Session, employee_id: int) -> dict:
        employee = EmployeeService.get_by_id(db, employee_id)
        employee.is_active = False
        db.commit()
        return {"message": f"Employee {employee.full_name} deactivated successfully"}

    @staticmethod
    def get_headcount_summary(db: Session) -> dict:
        total      = db.query(Employee).filter(Employee.is_active == True).count()
        permanent  = db.query(Employee).filter(Employee.is_active == True, Employee.employment_type == "permanent").count()
        contract   = db.query(Employee).filter(Employee.is_active == True, Employee.employment_type == "contract").count()
        casual     = db.query(Employee).filter(Employee.is_active == True, Employee.employment_type == "casual").count()
        trainee    = db.query(Employee).filter(Employee.is_active == True, Employee.employment_type == "trainee").count()

        return {
            "total_active": total,
            "by_type": {
                "permanent": permanent,
                "contract": contract,
                "casual": casual,
                "trainee": trainee
            }
        }