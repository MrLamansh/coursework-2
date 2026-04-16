from datetime import datetime
from pydantic import BaseModel


# Базовая схема (поля, общие для всех)
class UserBase(BaseModel):
    username: str
    role: str
    is_active: bool = True


# Схема для создания (здесь нужен пароль, который мы потом захешируем)
class UserCreate(UserBase):
    password: str


# Схема для логина (только имя пользователя и пароль)
class UserLogin(BaseModel):
    username: str
    password: str


# Схема для ответа API (читаем из БД, пароля здесь НЕТ)
class UserRead(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Схема для обновления пользователя (все поля опциональные)
class UserUpdate(BaseModel):
    username: str | None = None
    role: str | None = None
    is_active: bool | None = None
    password: str | None = None
