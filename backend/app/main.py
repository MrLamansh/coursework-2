from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler

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

from app.core.config import settings
from app.db.session import SessionLocal
from app.services.domain_scheduler import run_daily_check


def scheduled_domain_check():
    """Обёртка для APScheduler — создаёт свою сессию БД и закрывает после работы."""
    db = SessionLocal()
    try:
        run_daily_check(db)
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Запускаем планировщик при старте приложения
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
    print("Планировщик запущен. Проверка доменов каждый день в 03:00")

    yield  # Приложение работает

    # Останавливаем при выключении
    scheduler.shutdown()
    print("Планировщик остановлен")


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
app.include_router(users_router)
app.include_router(auth_router)
app.include_router(clients_router)
app.include_router(directories_router)
app.include_router(contracts_router)
app.include_router(domains_router)
app.include_router(requests_router)
app.include_router(events_router)
app.include_router(payments_router)