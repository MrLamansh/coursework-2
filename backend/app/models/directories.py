from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.db.base import Base


class DomainStatus(Base):
    __tablename__ = "domain_statuses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False, unique=True)

    domains = relationship("app.models.domain.Domain", back_populates="status")


class Registrar(Base):
    __tablename__ = "registrars"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    website_url = Column(String(255), nullable=True)

    domains = relationship("app.models.domain.Domain", back_populates="registrar")


class ContractStatus(Base):
    __tablename__ = "contract_statuses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False, unique=True)


class EventType(Base):
    __tablename__ = "event_types"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)


class PaymentStatus(Base):
    __tablename__ = "payment_statuses"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False, unique=True)


class PaymentType(Base):
    __tablename__ = "payment_types"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False, unique=True)


class RequestStatus(Base):
    __tablename__ = "request_statuses"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False, unique=True)


class RequestType(Base):
    __tablename__ = "request_types"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False, unique=True)
