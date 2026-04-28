from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from typing import List

from app.core.deps import require_role, get_current_user
from app.db.session import get_db
from app.models.client import Client
from app.models.contract import Contract
from app.models.directories import ContractStatus
from app.models.user import User
from app.schemas.contract import ContractCreate, ContractRead, ContractUpdate

router = APIRouter(prefix="/contracts", tags=["Contracts"])


@router.get(
    "/",
    response_model=List[ContractRead],
    dependencies=[Depends(require_role("manager", "engineer", "client"))],
)
def get_contracts(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Contract).filter(Contract.is_deleted.is_(False))

    # Если клиент, показать только свои договоры
    if current_user.role == "client":
        client = db.query(Client).filter(Client.user_id == current_user.id).first()
        if not client:
            return []
        query = query.filter(Contract.client_id == client.id)

    contracts = query.order_by(Contract.id).offset(skip).limit(limit).all()
    return contracts


@router.get(
    "/{contract_id}",
    response_model=ContractRead,
    dependencies=[Depends(require_role("manager", "engineer", "client"))],
)
def get_contract(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contract = (
        db.query(Contract)
        .filter(Contract.id == contract_id, Contract.is_deleted.is_(False))
        .first()
    )
    if not contract:
        raise HTTPException(status_code=404, detail="Контракт не найден")

    # Если клиент, проверить что это его договор
    if current_user.role == "client":
        client = db.query(Client).filter(Client.user_id == current_user.id).first()
        if not client or contract.client_id != client.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Доступ запрещён",
            )

    return contract


@router.post(
    "/",
    response_model=ContractRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role("manager"))],
)
def create_contract(contract_in: ContractCreate, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.id == contract_in.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Указанный клиент не найден")

    contract_status = (
        db.query(ContractStatus)
        .filter(ContractStatus.id == contract_in.status_id)
        .first()
    )
    if not contract_status:
        raise HTTPException(status_code=404, detail="Указанный статус контракта не найден")

    new_contract = Contract(**contract_in.model_dump())

    db.add(new_contract)
    try:
        db.commit()
        db.refresh(new_contract)
    except IntegrityError as e:
        db.rollback()
        error_msg = str(e.orig).lower()
        if "unique" in error_msg:
            raise HTTPException(status_code=400, detail="Контракт с таким номером уже существует")
        raise HTTPException(status_code=400, detail="Ошибка целостности данных")

    return new_contract


@router.put(
    "/{contract_id}",
    response_model=ContractRead,
    dependencies=[Depends(require_role("manager"))],
)
def update_contract(contract_id: int, contract_in: ContractUpdate, db: Session = Depends(get_db)):
    contract = (
        db.query(Contract)
        .filter(Contract.id == contract_id, Contract.is_deleted.is_(False))
        .first()
    )
    if not contract:
        raise HTTPException(status_code=404, detail="Контракт не найден")

    update_data = contract_in.model_dump(exclude_unset=True)

    if "client_id" in update_data:
        client = db.query(Client).filter(Client.id == update_data["client_id"]).first()
        if not client:
            raise HTTPException(status_code=404, detail="Указанный клиент не найден")

    if "status_id" in update_data:
        contract_status = (
            db.query(ContractStatus)
            .filter(ContractStatus.id == update_data["status_id"])
            .first()
        )
        if not contract_status:
            raise HTTPException(status_code=404, detail="Указанный статус контракта не найден")

    for field, value in update_data.items():
        setattr(contract, field, value)

    contract.updated_at = datetime.utcnow()

    try:
        db.commit()
        db.refresh(contract)
    except IntegrityError as e:
        db.rollback()
        error_msg = str(e.orig).lower()
        if "unique" in error_msg:
            raise HTTPException(status_code=400, detail="Контракт с таким номером уже существует")
        raise HTTPException(status_code=400, detail="Ошибка целостности данных")

    return contract


@router.delete(
    "/{contract_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_role("manager"))],
)
def delete_contract(contract_id: int, db: Session = Depends(get_db)):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract or contract.is_deleted:
        raise HTTPException(status_code=404, detail="Контракт не найден")

    contract.is_deleted = True
    contract.updated_at = datetime.utcnow()
    db.commit()
    return None