@echo off
echo ╔══════════════════════════════════════╗
echo ║     GF-HRMS STARTUP SCRIPT          ║
echo ╚══════════════════════════════════════╝

echo [1/4] Starting Docker containers...
docker-compose up -d
timeout /t 10

echo [2/4] Starting FastAPI server...
start "FastAPI" cmd /k "venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"

echo [3/4] Starting Celery Worker...
start "Celery Worker" cmd /k "venv\Scripts\activate && celery -A app.core.celery_app worker --loglevel=info --pool=solo"

echo [4/4] Starting Celery Beat + Flower...
start "Celery Beat" cmd /k "venv\Scripts\activate && celery -A app.core.celery_app beat --loglevel=info"
start "Flower" cmd /k "venv\Scripts\activate && celery -A app.core.celery_app flower --port=5555"

echo.
echo ✅ All services started!
echo.
echo FastAPI  → http://localhost:8000
echo Docs     → http://localhost:8000/docs
echo Flower   → http://localhost:5555
echo MinIO    → http://localhost:9001
echo.
pause