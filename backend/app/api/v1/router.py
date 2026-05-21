from fastapi import APIRouter
from app.api.v1.routes import auth
from app.api.v1.routes.employees import (
	router as employees_router,
	dept_router,
	section_router,
	desig_router,
)
from app.api.v1.routes import attendance

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(dept_router)
api_router.include_router(section_router)
api_router.include_router(desig_router)
api_router.include_router(employees_router)
api_router.include_router(attendance.shift_router)
api_router.include_router(attendance.router)
api_router.include_router(attendance.leave_router)