from sqlalchemy import Column, String, Integer, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class Department(BaseModel):
    __tablename__ = "departments"

    name        = Column(String(100), nullable=False, unique=True)
    code        = Column(String(20), nullable=False, unique=True)  # e.g. "SEW", "CUT"
    description = Column(Text, nullable=True)
    manager_id = Column(Integer, ForeignKey("employees.id", use_alter=True, name="fk_dept_manager"), nullable=True)

    # Relationships
    sections  = relationship("Section", back_populates="department")
    employees = relationship("Employee", back_populates="department",
                             foreign_keys="Employee.department_id")


class Section(BaseModel):
    __tablename__ = "sections"

    name          = Column(String(100), nullable=False)
    code          = Column(String(20), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)

    # Relationships
    department = relationship("Department", back_populates="sections")
    employees  = relationship("Employee", back_populates="section")


class Designation(BaseModel):
    __tablename__ = "designations"

    name        = Column(String(100), nullable=False, unique=True)
    grade       = Column(String(20), nullable=True)   # e.g. "G1", "G2", "M1"
    description = Column(Text, nullable=True)
    base_salary = Column(Integer, nullable=True)      # Minimum salary for this grade

    employees = relationship("Employee", back_populates="designation")