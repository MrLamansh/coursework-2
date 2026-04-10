from sqlalchemy import Column, Integer, String, DateTime, Date, ForeignKey, func
from app.database import Base


class Request(Base):
    __tablename__ = "requests"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(50), nullable=False)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    domain = Column(String(255), nullable=False)
    date = Column(Date, nullable=False)  # <-- было String(20), теперь Date
    status = Column(String(50), nullable=False, default="new")
    assignee = Column(String(255), nullable=True)
    description = Column(String(500), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
