from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.deps import require_role, get_current_user
from app.db.session import get_db
from app.models.contract import Contract
from app.models.domain import Domain
from app.models.payment import Payment
from app.models.directories import PaymentStatus, PaymentType
from app.models.user import User
from app.models.client import Client
from app.schemas.payment import PaymentCreate, PaymentRead, PaymentUpdate

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.get(
    "/",
    response_model=List[PaymentRead],
    dependencies=[Depends(require_role("manager", "engineer", "client"))],
)
def get_payments(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Payment).filter(Payment.is_deleted.is_(False))

    # Если клиент, показать только платежи своих договоров
    if current_user.role == "client":
        client = db.query(Client).filter(Client.user_id == current_user.id).first()
        if not client:
            return []
        query = query.join(Contract).filter(Contract.client_id == client.id)

    payments = query.order_by(Payment.id).offset(skip).limit(limit).all()
    return payments


@router.get(
    "/{payment_id}",
    response_model=PaymentRead,
    dependencies=[Depends(require_role("manager", "engineer", "client"))],
)
def get_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    payment = (
        db.query(Payment)
        .filter(Payment.id == payment_id, Payment.is_deleted.is_(False))
        .first()
    )
    if not payment:
        raise HTTPException(status_code=404, detail="Платёж не найден")

    # Если клиент, проверить что это его платёж
    if current_user.role == "client":
        client = db.query(Client).filter(Client.user_id == current_user.id).first()
        contract = db.query(Contract).filter(Contract.id == payment.contract_id).first()
        if not client or not contract or contract.client_id != client.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Доступ запрещён",
            )

    return payment


@router.post(
    "/",
    response_model=PaymentRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role("manager"))],
)
def create_payment(payment_in: PaymentCreate, db: Session = Depends(get_db)):
    payment_type = db.query(PaymentType).filter(PaymentType.id == payment_in.payment_type_id).first()
    if not payment_type:
        raise HTTPException(status_code=404, detail="Тип платежа не найден")

    payment_status = (
        db.query(PaymentStatus)
        .filter(PaymentStatus.id == payment_in.payment_status_id)
        .first()
    )
    if not payment_status:
        raise HTTPException(status_code=404, detail="Статус платежа не найден")

    contract = db.query(Contract).filter(Contract.id == payment_in.contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Контракт не найден")

    if payment_in.domain_id is not None:
        domain = db.query(Domain).filter(Domain.id == payment_in.domain_id).first()
        if not domain:
            raise HTTPException(status_code=404, detail="Домен не найден")

    new_payment = Payment(**payment_in.model_dump())
    db.add(new_payment)
    db.commit()
    db.refresh(new_payment)
    return new_payment


@router.put(
    "/{payment_id}",
    response_model=PaymentRead,
    dependencies=[Depends(require_role("manager"))],
)
def update_payment(payment_id: int, payment_in: PaymentUpdate, db: Session = Depends(get_db)):
    payment = (
        db.query(Payment)
        .filter(Payment.id == payment_id, Payment.is_deleted.is_(False))
        .first()
    )
    if not payment:
        raise HTTPException(status_code=404, detail="Платёж не найден")

    update_data = payment_in.model_dump(exclude_unset=True)

    if "payment_type_id" in update_data:
        payment_type = db.query(PaymentType).filter(PaymentType.id == update_data["payment_type_id"]).first()
        if not payment_type:
            raise HTTPException(status_code=404, detail="Тип платежа не найден")

    if "payment_status_id" in update_data:
        payment_status = (
            db.query(PaymentStatus)
            .filter(PaymentStatus.id == update_data["payment_status_id"])
            .first()
        )
        if not payment_status:
            raise HTTPException(status_code=404, detail="Статус платежа не найден")

    if "contract_id" in update_data:
        contract = db.query(Contract).filter(Contract.id == update_data["contract_id"]).first()
        if not contract:
            raise HTTPException(status_code=404, detail="Контракт не найден")

    if "domain_id" in update_data and update_data["domain_id"] is not None:
        domain = db.query(Domain).filter(Domain.id == update_data["domain_id"]).first()
        if not domain:
            raise HTTPException(status_code=404, detail="Домен не найден")

    for field, value in update_data.items():
        setattr(payment, field, value)

    payment.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(payment)
    return payment


@router.delete(
    "/{payment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_role("manager"))],
)
def delete_payment(payment_id: int, db: Session = Depends(get_db)):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment or payment.is_deleted:
        raise HTTPException(status_code=404, detail="Платёж не найден")

    payment.is_deleted = True
    payment.updated_at = datetime.utcnow()
    db.commit()
    return None