from datetime import datetime
from pydantic import BaseModel


class DomainBase(BaseModel):
    domain_name: str
    registration_date: datetime
    expiration_date: datetime
    current_status_id: int
    registrar_id: int
    contract_id: int
    assigned_engineer_id: int | None = None
    is_deleted: bool = False


class DomainCreate(DomainBase):
    pass


class DomainRead(DomainBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DomainUpdate(BaseModel):
    domain_name: str | None = None
    registration_date: datetime | None = None
    expiration_date: datetime | None = None
    current_status_id: int | None = None
    registrar_id: int | None = None
    contract_id: int | None = None
    assigned_engineer_id: int | None = None
    is_deleted: bool | None = None
