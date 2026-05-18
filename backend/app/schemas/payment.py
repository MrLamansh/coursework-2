from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class PaymentBase(BaseModel):
    amount: Decimal
    payment_date: datetime
    payment_type_id: int
    payment_status_id: int
    domain_id: int | None = None
    contract_id: int


class PaymentCreate(PaymentBase):
    pass


class PaymentRead(PaymentBase):
    id: int
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PaymentUpdate(BaseModel):
    amount: Decimal | None = None
    payment_date: datetime | None = None
    payment_type_id: int | None = None
    payment_status_id: int | None = None
    domain_id: int | None = None
    contract_id: int | None = None

    class Config:
        from_attributes = True