from pydantic import BaseModel


class DirectoryBase(BaseModel):
    name: str


class DirectoryRead(DirectoryBase):
    id: int

    class Config:
        from_attributes = True


class RegistrarBase(BaseModel):
    name: str
    website_url: str | None = None


class RegistrarRead(RegistrarBase):
    id: int

    class Config:
        from_attributes = True
