from sqlalchemy import Column, Integer, Boolean, DateTime, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Numeric(15, 2), nullable=False)
    payment_date = Column(DateTime, nullable=False)
    payment_type_id = Column(Integer, ForeignKey("payment_types.id"), nullable=False)
    payment_status_id = Column(Integer, ForeignKey("payment_statuses.id"), nullable=False)
    domain_id = Column(Integer, ForeignKey("domains.id"), nullable=True)
    contract_id = Column(Integer, ForeignKey("contracts.id"), nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now())

    payment_type = relationship("PaymentType")
    payment_status = relationship("PaymentStatus")

