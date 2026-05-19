from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.api.v1.router import api_router
from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.core.security import hash_password

def create_first_admin():
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == settings.first_admin_email).first()
        if not existing:
            admin = User(
                email=settings.first_admin_email,
                username="admin",
                hashed_password=hash_password(settings.first_admin_password),
                role=UserRole.SUPER_ADMIN,
                is_verified=True,
                is_active=True
            )
            db.add(admin)
            db.commit()
            print(f"✅ Admin user created: {settings.first_admin_email}")
        else:
            print(f"✅ Admin user already exists")
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_first_admin()   # Runs on startup
    yield

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Garment Factory HR Management System API",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

@app.get("/", tags=["Health"])
def root():
    return {"system": settings.app_name, "version": settings.app_version, "status": "running", "docs": "/docs"}

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy"}