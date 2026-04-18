from sqlalchemy import Column, Integer, DateTime, ForeignKey, Text, BigInteger
from app.db.base import Base
from sqlalchemy.sql import func


class DomainEvent(Base):
    __tablename__ = "domain_events"

    id = Column(Integer, primary_key=True, index=True)
    event_type_id = Column("event_type_id", Integer, ForeignKey("event_types.id"), nullable=False)
    event_date = Column("event_date", DateTime, nullable=False)
    notes = Column(Text, nullable=True)

    domain_id = Column("domain_id", Integer, ForeignKey("domains.id"), nullable=False)
    created_by_user_id = Column("created_by_user_id", BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime, nullable=False, server_default=func.now())
