from fastapi import APIRouter
from app.api.v1.routes import auth
from app.api.v1.routes import employees

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(employees.dept_router)
api_router.include_router(employees.section_router)
api_router.include_router(employees.desig_router)
api_router.include_router(employees.router)