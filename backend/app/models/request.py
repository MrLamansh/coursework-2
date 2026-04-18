from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, BigInteger
from app.db.base import Base
from sqlalchemy.sql import func


class Request(Base):
    __tablename__ = "requests"

    id = Column(Integer, primary_key=True, index=True)
    request_number = Column("request_number", String(100), nullable=False, unique=True)
    created_date = Column("created_date", DateTime, nullable=False)

    # Внешние ключи на справочники
    request_type_id = Column("request_type_id", Integer, ForeignKey("request_types.id"), nullable=False)
    execution_status_id = Column("execution_status_id", Integer, ForeignKey("request_statuses.id"), nullable=False)

    # Внешние ключи на сущности
    client_id = Column("client_id", Integer, ForeignKey("clients.id"), nullable=False)
    contract_id = Column("contract_id", Integer, ForeignKey("contracts.id"), nullable=False)
    domain_id = Column("domain_id", Integer, ForeignKey("domains.id"), nullable=True)

    # Инженеры и создатели
    assigned_engineer_id = Column("assigned_engineer_id", BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_by_user_id = Column("created_by_user_id", BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    description = Column(Text, nullable=True)
    is_deleted = Column("is_deleted", Boolean, default=False, nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
