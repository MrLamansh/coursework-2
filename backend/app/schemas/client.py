from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class ClientBase(BaseModel):
    name: str
    contact_person: str
    email: str
    phone: str | None = None
    inn: str | None = None
    user_id: int | None = None


class ClientCreate(ClientBase):
    user_id: int | None = None


class ClientUpdate(BaseModel):
    name: str | None = None
    contact_person: str | None = None
    email: str | None = None
    phone: str | None = None
    inn: str | None = None
    user_id: int | None = None
    is_deleted: bool | None = None


class ClientRead(ClientBase):
    id: int
    user_id: int | None
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)