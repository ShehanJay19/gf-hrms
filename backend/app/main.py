from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Garment Factory HR Management System API",
    docs_url="/docs",       # Swagger UI at http://localhost:8000/docs
    redoc_url="/redoc"
)

# Allow React frontend to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", tags=["Health"])
def root():
    return {
        "system": settings.app_name,
        "version": settings.app_version,
        "status": "running",
        "docs": "/docs"
    }

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy"}