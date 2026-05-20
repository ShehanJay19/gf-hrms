from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import date
from decimal import Decimal
from app.models.employee import EmploymentType, Gender, MaritalStatus

class DepartmentCreate(BaseModel):
    name: str
    code: str
    description: Optional[str] = None

class DepartmentResponse(BaseModel):
    id: int
    name: str
    code: str
    description: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True

class SectionCreate(BaseModel):
    name: str
    code: str
    department_id: int

class SectionResponse(BaseModel):
    id: int
    name: str
    code: str
    department_id: int
    is_active: bool

    class Config:
        from_attributes = True

class DesignationCreate(BaseModel):
    name: str
    grade: Optional[str] = None
    description: Optional[str] = None
    base_salary: Optional[int] = None

class DesignationResponse(BaseModel):
    id: int
    name: str
    grade: Optional[str] = None
    base_salary: Optional[int] = None
    is_active: bool

    class Config:
        from_attributes = True

class EmployeeCreate(BaseModel):
    # Personal
    employee_no: str
    first_name: str
    last_name: str
    nic: str
    date_of_birth: date
    gender: Gender
    marital_status: Optional[MaritalStatus] = None

    # Contact
    mobile: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    emergency_name: Optional[str] = None
    emergency_tel: Optional[str] = None

    # Employment
    employment_type: EmploymentType = EmploymentType.PERMANENT
    joined_date: date
    probation_end: Optional[date] = None
    department_id: Optional[int] = None
    section_id: Optional[int] = None
    designation_id: Optional[int] = None

    # Salary
    basic_salary: Decimal = Decimal("0")
    bank_name: Optional[str] = None
    bank_account_no: Optional[str] = None
    bank_branch: Optional[str] = None
    epf_no: Optional[str] = None
    biometric_id: Optional[str] = None

    @field_validator("gender", "employment_type", "marital_status", mode="before")
    def normalize_enum_values(cls, value):
        if isinstance(value, str):
            return value.strip().lower()
        return value

class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    mobile: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    emergency_name: Optional[str] = None
    emergency_tel: Optional[str] = None
    employment_type: Optional[EmploymentType] = None
    department_id: Optional[int] = None
    section_id: Optional[int] = None
    designation_id: Optional[int] = None
    basic_salary: Optional[Decimal] = None
    bank_name: Optional[str] = None
    bank_account_no: Optional[str] = None
    bank_branch: Optional[str] = None
    epf_no: Optional[str] = None
    biometric_id: Optional[str] = None
    marital_status: Optional[MaritalStatus] = None

    @field_validator("employment_type", "marital_status", mode="before")
    def normalize_enum_values(cls, value):
        if isinstance(value, str):
            return value.strip().lower()
        return value

class EmployeeResponse(BaseModel):
    id: int
    employee_no: str
    first_name: str
    last_name: str
    full_name: str
    nic: str
    date_of_birth: date
    gender: Gender
    mobile: Optional[str] = None
    email: Optional[str] = None
    employment_type: EmploymentType
    joined_date: date
    probation_end: Optional[date] = None
    department_id: Optional[int] = None
    section_id: Optional[int] = None
    designation_id: Optional[int] = None
    basic_salary: Decimal
    epf_no: Optional[str] = None
    biometric_id: Optional[str] = None
    is_active: bool

    # Nested
    department: Optional[DepartmentResponse] = None
    section: Optional[SectionResponse] = None
    designation: Optional[DesignationResponse] = None

    class Config:
        from_attributes = True

class EmployeeListResponse(BaseModel):
    id: int
    employee_no: str
    full_name: str
    nic: str
    employment_type: EmploymentType
    joined_date: date
    basic_salary: Decimal
    is_active: bool
    department: Optional[DepartmentResponse] = None
    designation: Optional[DesignationResponse] = None

    class Config:
        from_attributes = True