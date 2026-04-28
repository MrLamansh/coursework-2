from datetime import datetime
from pydantic import BaseModel


class ContractBase(BaseModel):
    contact_number: str
    sign_date: datetime
    status_id: int
    client_id: int
    payment_terms: str | None = None


class ContractCreate(ContractBase):
    pass


class ContractRead(ContractBase):
    id: int
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ContractUpdate(BaseModel):
    contact_number: str | None = None
    sign_date: datetime | None = None
    status_id: int | None = None
    client_id: int | None = None
    payment_terms: str | None = None
    is_deleted: bool | None = None

    class Config:
        from_attributes = True