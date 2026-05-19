from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import require_role
from app.db.session import get_db
from app.models.directories import (
    DomainStatus, Registrar, ContractStatus,
    EventType, PaymentStatus, PaymentType,
    RequestStatus, RequestType
)
from app.schemas.directories import DirectoryRead, RegistrarRead

router = APIRouter(prefix="/directories", tags=["Directories"])

common_dep = [Depends(require_role("manager", "engineer", "client"))]


@router.get("/domain-statuses", response_model=list[DirectoryRead], dependencies=common_dep)
def get_domain_statuses(db: Session = Depends(get_db)):
    return db.query(DomainStatus).order_by(DomainStatus.id).all()


@router.get("/contract-statuses", response_model=list[DirectoryRead], dependencies=common_dep)
def get_contract_statuses(db: Session = Depends(get_db)):
    return db.query(ContractStatus).order_by(ContractStatus.id).all()


@router.get("/registrars", response_model=list[RegistrarRead], dependencies=common_dep)
def get_registrars(db: Session = Depends(get_db)):
    return db.query(Registrar).order_by(Registrar.id).all()


@router.get("/event-types", response_model=list[DirectoryRead], dependencies=common_dep)
def get_event_types(db: Session = Depends(get_db)):
    return db.query(EventType).order_by(EventType.id).all()


@router.get("/payment-statuses", response_model=list[DirectoryRead], dependencies=common_dep)
def get_payment_statuses(db: Session = Depends(get_db)):
    return db.query(PaymentStatus).order_by(PaymentStatus.id).all()


@router.get("/payment-types", response_model=list[DirectoryRead], dependencies=common_dep)
def get_payment_types(db: Session = Depends(get_db)):
    return db.query(PaymentType).order_by(PaymentType.id).all()


@router.get("/request-statuses", response_model=list[DirectoryRead], dependencies=common_dep)
def get_request_statuses(db: Session = Depends(get_db)):
    return db.query(RequestStatus).order_by(RequestStatus.id).all()


@router.get("/request-types", response_model=list[DirectoryRead], dependencies=common_dep)
def get_request_types(db: Session = Depends(get_db)):
    return db.query(RequestType).order_by(RequestType.id).all()