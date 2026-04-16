from fastapi.middleware.cors import CORSMiddleware

from fastapi import FastAPI

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

app = FastAPI(
    title=settings.app_name,
    debug=settings.debug
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
