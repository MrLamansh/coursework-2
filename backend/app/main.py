from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
import app.models

from app.routers import clients, domains
from app.routers.clients import router as clients_router
from app.routers.requests import router as requests_router

app = FastAPI(title="Domain Manager API", version="0.1.0")

origins = [
    "http://localhost:63342",
    "http://127.0.0.1:63342",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
]


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(clients.router)
app.include_router(domains.router)
app.include_router(clients_router)
app.include_router(requests_router)


@app.get("/")
def root():
    return {"message": "Domain Manager API is running"}
