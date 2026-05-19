from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler

logger = logging.getLogger(__name__)

from app.api.health import router as health_router
from app.api.users import router as users_router
from app.api.auth import router as auth_router
from app.api.clients import router as clients_router
from app.api.directories import router as directories_router
from app.api.contracts import router as contracts_router
from app.api.domains import router as domains_router
from app.api.requests import router as requests_router
from app.api.events import router as events_router
from app.api.payments import router as payments_router
from app.api.reports import router as reports_router

from app.core.config import settings
from app.db.session import SessionLocal
from app.services.domain_scheduler import run_daily_check, sync_all_domain_statuses


def scheduled_domain_check():
    db = SessionLocal()
    try:
        run_daily_check(db)
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    startup_db = SessionLocal()
    try:
        sync_all_domain_statuses(startup_db)
    except Exception as exc:
        logger.error(f"Не удалось синхронизировать статусы доменов при старте: {exc}")
    finally:
        startup_db.close()

    scheduler = BackgroundScheduler()
    scheduler.add_job(
        scheduled_domain_check,
        trigger="cron",
        hour=3,
        minute=0,
        id="daily_domain_check",
        replace_existing=True
    )
    scheduler.start()
    logger.info("Планировщик запущен. Проверка доменов каждый день в 03:00")

    yield

    scheduler.shutdown()
    logger.info("Планировщик остановлен")


app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(directories_router)
app.include_router(clients_router)
app.include_router(contracts_router)
app.include_router(domains_router)
app.include_router(requests_router)
app.include_router(events_router)
app.include_router(payments_router)
app.include_router(reports_router)
