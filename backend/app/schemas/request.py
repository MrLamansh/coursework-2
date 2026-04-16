from datetime import datetime
from pydantic import BaseModel


class RequestBase(BaseModel):
    request_number: str
    created_date: datetime
    request_type_id: int
    execution_status_id: int
    client_id: int
    contract_id: int
    domain_id: int | None = None
    assigned_engineer_id: int | None = None
    created_by_user_id: int | None = None
    description: str | None = None
    is_deleted: bool = False


class RequestCreate(RequestBase):
    pass


class RequestRead(RequestBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
