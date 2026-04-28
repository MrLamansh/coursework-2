from sqlalchemy import BigInteger, Column, Integer, String, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.db.base import Base


class Domain(Base):
    __tablename__ = "domains"

    id = Column(Integer, primary_key=True, index=True)
    domain_name = Column(String(255), nullable=False, unique=True)
    registration_date = Column(DateTime, nullable=False)
    expiration_date = Column(DateTime, nullable=False)

    current_status_id = Column(Integer, ForeignKey("domain_statuses.id"), nullable=False)
    registrar_id = Column(Integer, ForeignKey("registrars.id"), nullable=False)
    contract_id = Column(Integer, ForeignKey("contracts.id"), nullable=False)

    is_deleted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now())

    # Связи
    status = relationship("DomainStatus", back_populates="domains")
    registrar = relationship("Registrar", back_populates="domains")
    contract = relationship("Contract", back_populates="domains")