from pydantic import BaseModel


# Базовая схема для справочников (id и name)
class DirectoryBase(BaseModel):
    name: str


class DirectoryRead(DirectoryBase):
    id: int

    class Config:
        from_attributes = True


# Схема для регистратора (у него есть дополнительное поле websiteurl)
class RegistrarBase(BaseModel):
    name: str
    websiteurl: str | None = None


class RegistrarRead(RegistrarBase):
    id: int

    class Config:
        from_attributes = True
