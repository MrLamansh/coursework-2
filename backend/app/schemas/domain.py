from datetime import datetime
from pydantic import BaseModel, ConfigDict


# Вспомогательные схемы для отображения связанных данных (чтобы не было голых ID)
class ClientMinimal(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class ContractMinimal(BaseModel):
    id: int
    contact_number: str
    client: ClientMinimal | None = None

    model_config = ConfigDict(from_attributes=True)


class DomainStatusMinimal(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class RegistrarMinimal(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


# Основные схемы домена
class DomainBase(BaseModel):
    domain_name: str
    registration_date: datetime
    expiration_date: datetime
    current_status_id: int
    registrar_id: int
    contract_id: int


class DomainCreate(DomainBase):
    pass


class DomainUpdate(BaseModel):
    domain_name: str | None = None
    registration_date: datetime | None = None
    expiration_date: datetime | None = None
    current_status_id: int | None = None
    registrar_id: int | None = None
    contract_id: int | None = None
    is_deleted: bool | None = None


class DomainRead(DomainBase):
    id: int
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    status: DomainStatusMinimal | None = None
    registrar: RegistrarMinimal | None = None
    contract: ContractMinimal | None = None

    model_config = ConfigDict(from_attributes=True)