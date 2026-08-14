from pydantic import BaseModel
from typing import Optional
from datetime import date

class AbsenteeismReport(BaseModel):
    department: str
    total_employees: int
    avg_attendance_rate: float
    total_absent_days: int
    chronic_absentees: int  # absent > 3 days/month

class LateArrivalReport(BaseModel):
    employee_id: int
    employee_no: str
    full_name: str
    department: str
    late_count: int
    total_late_minutes: int
    avg_late_minutes: float

class OTAnalysisReport(BaseModel):
    employee_id: int
    employee_no: str
    full_name: str
    department: str
    total_ot_hours: float
    ot_cost: float
    ot_days: int

class TurnoverReport(BaseModel):
    month: int
    year: int
    total_employees: int
    new_hires: int
    resignations: int
    turnover_rate: float

class LabourCostReport(BaseModel):
    department: str
    total_employees: int
    total_basic: float
    total_ot: float
    total_allowances: float
    total_gross: float
    total_epf_etf: float
    cost_per_employee: float

class ExecutiveKPI(BaseModel):
    daily_attendance_rate: float
    monthly_turnover_rate: float
    total_active_employees: int
    total_ot_hours_month: float
    total_labour_cost_month: float
    epf_etf_liability_month: float
    pending_leave_requests: int
    absenteeism_rate: float
    alerts: list[dict]