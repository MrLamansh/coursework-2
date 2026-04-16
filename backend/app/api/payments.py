from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models.payment import Payment
from app.schemas.payment import PaymentRead, PaymentCreate

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.get("/", response_model=List[PaymentRead])
def get_payments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Payment).filter(Payment.is_deleted == False) \
        .order_by(Payment.id).offset(skip).limit(limit).all()


@router.post("/", response_model=PaymentRead, status_code=201)
def create_payment(payment_in: PaymentCreate, db: Session = Depends(get_db)):
    new_payment = Payment(**payment_in.model_dump())
    db.add(new_payment)
    db.commit()
    db.refresh(new_payment)
    return new_payment
