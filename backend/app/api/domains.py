from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models.domain import Domain
from app.models.contract import Contract
from app.models.directories import DomainStatus, Registrar
from app.schemas.domain import DomainRead, DomainCreate

router = APIRouter(prefix="/domains", tags=["Domains"])


@router.get("/", response_model=List[DomainRead])
def get_domains(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Domain).filter(Domain.is_deleted == False) \
        .order_by(Domain.id).offset(skip).limit(limit).all()


@router.post("/", response_model=DomainRead, status_code=201)
def create_domain(domain_in: DomainCreate, db: Session = Depends(get_db)):
    # Проверка существования связанных записей
    contract = db.query(Contract).filter(Contract.id == domain_in.contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Контракт не найден")

    status = db.query(DomainStatus).filter(DomainStatus.id == domain_in.current_status_id).first()
    if not status:
        raise HTTPException(status_code=404, detail="Статус домена не найден")

    registrar = db.query(Registrar).filter(Registrar.id == domain_in.registrar_id).first()
    if not registrar:
        raise HTTPException(status_code=404, detail="Регистратор не найден")

    # Проверка на уникальность имени домена
    existing_domain = db.query(Domain).filter(Domain.domain_name == domain_in.domain_name).first()
    if existing_domain:
        raise HTTPException(status_code=400, detail="Домен с таким именем уже существует")

    new_domain = Domain(**domain_in.model_dump())
    db.add(new_domain)
    db.commit()
    db.refresh(new_domain)

    return new_domain