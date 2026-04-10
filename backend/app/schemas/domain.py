from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel


class DomainBase(BaseModel):
    name: str
    registrar: str
    client_id: int
    reg_date: date
    exp_date: date
    status: str = "active"
    price: Decimal = Decimal("0.00")
    note: str | None = None


class DomainCreate(DomainBase):
    pass


class DomainUpdate(DomainBase):
    pass


class DomainRead(DomainBase):
    id: int
    created_at: datetime | None = None

    model_config = {"from_attributes": True}