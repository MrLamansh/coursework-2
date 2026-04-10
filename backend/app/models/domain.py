from sqlalchemy import Column, Integer, String, Date, ForeignKey, Numeric, Text, DateTime, func
from sqlalchemy.orm import relationship
from app.database import Base


class Domain(Base):
    __tablename__ = "domains"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    registrar = Column(String(100), nullable=False)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False)
    reg_date = Column(Date, nullable=False)
    exp_date = Column(Date, nullable=False)
    status = Column(String(50), nullable=False, default="active")
    price = Column(Numeric(10, 2), nullable=False, default=0)
    note = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

    client = relationship("Client", back_populates="domains")