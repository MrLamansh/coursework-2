from datetime import datetime
from pydantic import BaseModel, EmailStr


class ClientBase(BaseModel):
    name: str
    contact: str
    email: EmailStr
    phone: str
    inn: str


class ClientCreate(ClientBase):
    pass


class ClientRead(ClientBase):
    id: int
    created_at: datetime | None = None

    model_config = {"from_attributes": True}