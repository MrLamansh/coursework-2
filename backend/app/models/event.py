from sqlalchemy import Column, Integer, DateTime, ForeignKey, Text, BigInteger
from app.db.base import Base
from sqlalchemy.sql import func


class DomainEvent(Base):
    __tablename__ = "domain_events"

    id = Column(Integer, primary_key=True, index=True)
    event_type_id = Column("event_type_id", Integer, ForeignKey("event_types.id"), nullable=False)
    notes = Column(Text, nullable=True)
    domain_id = Column("domain_id", Integer, ForeignKey("domains.id"), nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
