from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models.contract import Contract
from app.models.client import Client
from app.models.directories import ContractStatus
from app.schemas.contract import ContractRead, ContractCreate

router = APIRouter(prefix="/contracts", tags=["Contracts"])


@router.get("/", response_model=List[ContractRead])
def get_contracts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Contract).filter(Contract.is_deleted == False) \
        .order_by(Contract.id).offset(skip).limit(limit).all()


@router.post("/", response_model=ContractRead, status_code=201)
def create_contract(contract_in: ContractCreate, db: Session = Depends(get_db)):
    # Проверяем, существует ли клиент (используем client_in.client_id)
    client = db.query(Client).filter(Client.id == contract_in.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Указанный клиент не найден")

    # Проверяем, существует ли статус контракта (используем contract_in.status_id)
    status = db.query(ContractStatus).filter(ContractStatus.id == contract_in.status_id).first()
    if not status:
        raise HTTPException(status_code=404, detail="Указанный статус контракта не найден")

    # Создаем контракт
    new_contract = Contract(**contract_in.model_dump())
    db.add(new_contract)
    db.commit()
    db.refresh(new_contract)

    return new_contract
