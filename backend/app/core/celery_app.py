from celery import Celery
from celery.schedules import crontab
from app.core.config import settings

celery_app = Celery(
    "gf_hrms",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=[
        "app.tasks.attendance_tasks",
        "app.tasks.payroll_tasks",
        "app.tasks.alert_tasks",
    ]
)

celery_app.conf.update(
    task_serializer       = "json",
    accept_content        = ["json"],
    result_serializer     = "json",
    timezone              = "Asia/Colombo",
    enable_utc            = True,
    task_track_started    = True,
    task_acks_late        = True,
    worker_prefetch_multiplier = 1,
)

# ── Scheduled Tasks (Cron Jobs) ──────────────────────────
celery_app.conf.beat_schedule = {

    # Every day at 6:30 PM — mark absent employees
    "mark-absent-end-of-day": {
        "task":     "app.tasks.attendance_tasks.mark_absent_employees",
        "schedule": crontab(hour=18, minute=30),
    },

    # Every day at 7:00 PM — save KPI snapshot
    "daily-kpi-snapshot": {
        "task":     "app.tasks.alert_tasks.save_daily_kpi_snapshot",
        "schedule": crontab(hour=19, minute=0),
    },

    # Every day at 7:30 PM — check KPI alerts
    "check-kpi-alerts": {
        "task":     "app.tasks.alert_tasks.check_and_send_alerts",
        "schedule": crontab(hour=19, minute=30),
    },

    # 1st of every month at 8:00 AM — reset monthly counters
    "monthly-reset": {
        "task":     "app.tasks.attendance_tasks.initialize_monthly_leave_balances",
        "schedule": crontab(hour=8, minute=0, day_of_month=1),
    },

    # 25th of every month — payroll reminder
    "payroll-reminder": {
        "task":     "app.tasks.payroll_tasks.send_payroll_reminder",
        "schedule": crontab(hour=9, minute=0, day_of_month=25),
    },
}