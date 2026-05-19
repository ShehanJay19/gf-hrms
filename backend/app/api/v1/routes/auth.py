from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.auth import UserCreate, UserLogin, TokenResponse, RefreshRequest, UserResponse
from app.services.auth_service import AuthService
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=201)
def register(data: UserCreate, db: Session = Depends(get_db)):
    """Create a new user account"""
    return AuthService.create_user(db, data)

@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    """Login and get JWT tokens"""
    return AuthService.login(db, data.email, data.password)

@router.post("/refresh", response_model=TokenResponse)
def refresh(data: RefreshRequest, db: Session = Depends(get_db)):
    """Get new access token using refresh token"""
    return AuthService.refresh_token(db, data.refresh_token)

@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    """Get currently logged in user"""
    return current_user