from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.auth_service import AuthService
from app.models.user import User, UserRole

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    return AuthService.get_current_user(db, credentials.credentials)

def require_roles(*roles: UserRole):
    """
    Usage:
        @router.get("/", dependencies=[Depends(require_roles(UserRole.HR_MANAGER))])
    """
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {[r.value for r in roles]}"
            )
        return current_user
    return role_checker

# Shortcut dependencies for common roles
def hr_manager_only(user: User = Depends(require_roles(UserRole.HR_MANAGER, UserRole.SUPER_ADMIN))) -> User:
    return user

def payroll_only(user: User = Depends(require_roles(UserRole.PAYROLL_OFFICER, UserRole.SUPER_ADMIN))) -> User:
    return user

def supervisor_and_above(user: User = Depends(require_roles(
    UserRole.LINE_SUPERVISOR, UserRole.HR_MANAGER,
    UserRole.PAYROLL_OFFICER, UserRole.SUPER_ADMIN
))) -> User:
    return user