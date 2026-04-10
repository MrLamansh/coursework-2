from datetime import date, datetime
from pydantic import BaseModel
from typing import Optional


class RequestBase(BaseModel):
    type: str
    client_id: int
    domain: str
    date: date
    status: str = "new"
    assignee: Optional[str] = None
    description: Optional[str] = None


class RequestCreate(RequestBase):
    pass


class RequestRead(RequestBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
