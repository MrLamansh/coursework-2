from datetime import datetime
from pydantic import BaseModel
from decimal import Decimal


class PaymentBase(BaseModel):
    amount: Decimal
    payment_date: datetime
    payment_type_id: int
    payment_status_id: int
    domain_id: int | None = None
    contract_id: int
    is_deleted: bool = False


class PaymentCreate(PaymentBase):
    pass


class PaymentRead(PaymentBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
