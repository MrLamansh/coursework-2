from sqlalchemy import Column, BigInteger, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True, index=True)
    username = Column(String(100), nullable=False, unique=True)
    password_hash = Column("password_hash", String(255), nullable=False)
    role = Column(String(20), nullable=False)

    is_active = Column("is_active", Boolean, default=True, nullable=False)
    created_at = Column("created_at", DateTime, nullable=False, server_default=func.now())
    updated_at = Column("updated_at", DateTime, nullable=False, server_default=func.now())

    clients = relationship("Client", back_populates="user")
    assigned_domains = relationship("Domain", back_populates="assigned_engineer")