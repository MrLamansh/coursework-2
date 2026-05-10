from datetime import datetime
from pydantic import BaseModel


class RequestBase(BaseModel):
    # Для клиента некоторые поля не обязательны и будут заполняться на сервере
    request_type_id: int
    execution_status_id: int | None = None
    client_id: int | None = None
    contract_id: int | None = None
    domain_id: int | None = None
    assigned_engineer_id: int | None = None
    description: str | None = None


class RequestCreate(RequestBase):
    pass


class RequestRead(RequestBase):
    id: int
    request_number: str
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RequestUpdate(BaseModel):
    request_type_id: int | None = None
    execution_status_id: int | None = None
    client_id: int | None = None
    contract_id: int | None = None
    domain_id: int | None = None
    assigned_engineer_id: int | None = None
    description: str | None = None
    is_deleted: bool | None = None

    class Config:
        from_attributes = True