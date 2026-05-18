from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class Contract(Base):
    __tablename__ = "contracts"

    id = Column(Integer, primary_key=True, index=True)
    contact_number = Column(String(100), nullable=False, unique=True)
    sign_date = Column(DateTime, nullable=False)
    status_id = Column(Integer, ForeignKey("contract_statuses.id"), nullable=False)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    payment_terms = Column(Text, nullable=True)
    is_deleted = Column(Boolean, default=False, nullable=False)
    created_at = Column("created_at", DateTime, nullable=False, server_default=func.now())
    updated_at = Column("updated_at", DateTime, nullable=False, server_default=func.now())

    # Связи
    client = relationship("Client", back_populates="contracts")
    domains = relationship("Domain", back_populates="contract")