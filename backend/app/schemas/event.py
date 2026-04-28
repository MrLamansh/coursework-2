from datetime import datetime
from pydantic import BaseModel


class DomainEventBase(BaseModel):
    event_type_id: int
    notes: str | None = None
    domain_id: int


class DomainEventCreate(DomainEventBase):
    pass


class DomainEventRead(DomainEventBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
