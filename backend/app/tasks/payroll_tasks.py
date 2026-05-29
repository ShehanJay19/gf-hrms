from celery.utils.log import get_task_logger
from datetime import date

from app.core.celery_app import celery_app
from app.core.database import SessionLocal
from app.models.payroll import PayrollRun, PayrollStatus

logger = get_task_logger(__name__)


@celery_app.task(name="app.tasks.payroll_tasks.send_payroll_reminder")
def send_payroll_reminder():
    """
    Runs on 25th of every month.
    Checks if payroll has been started for current month.
    Logs reminder if not.
    """
    db    = SessionLocal()
    today = date.today()

    try:
        existing = db.query(PayrollRun).filter(
            PayrollRun.month == today.month,
            PayrollRun.year  == today.year
        ).first()

        if not existing:
            logger.warning(
                f"PAYROLL REMINDER: Payroll for "
                f"{today.month}/{today.year} has NOT been started yet!"
            )
            return {
                "reminded": True,
                "message":  f"Payroll for {today.month}/{today.year} not started"
            }
        else:
            logger.info(
                f"Payroll for {today.month}/{today.year} "
                f"already exists. Status: {existing.status}"
            )
            return {"reminded": False, "status": existing.status}

    finally:
        db.close()


@celery_app.task(name="app.tasks.payroll_tasks.auto_process_payroll")
def auto_process_payroll(run_id: int):
    """
    Triggered manually to process payroll in background.
    Prevents request timeout for large employee counts.
    """
    from app.services.payroll_service import PayrollService

    db = SessionLocal()
    try:
        result = PayrollService.process_run(db, run_id)
        logger.info(f"Auto payroll processed: {result}")
        return result
    except Exception as e:
        logger.error(f"Error in auto payroll: {e}")
        raise
    finally:
        db.close()