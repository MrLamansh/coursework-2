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
    assigned_engineer_id = Column(BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    is_deleted = Column(Boolean, default=False, nullable=False)
    created_at = Column("created_at", DateTime, nullable=False, server_default=func.now())
    updated_at = Column("updated_at", DateTime, nullable=False, server_default=func.now())

    # Связи
    status = relationship("DomainStatus", back_populates="domains")
    registrar = relationship("Registrar", back_populates="domains")
    contract = relationship("Contract", back_populates="domains")
    assigned_engineer = relationship("User", back_populates="assigned_domains")