from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models.event import DomainEvent
from app.schemas.event import DomainEventRead, DomainEventCreate

router = APIRouter(prefix="/events", tags=["Domain Events"])

@router.get("/domain/{domain_id}", response_model=List[DomainEventRead])
def get_events_for_domain(domain_id: int, db: Session = Depends(get_db)):
    """Получить историю событий для конкретного домена"""
    return db.query(DomainEvent).filter(DomainEvent.domain_id == domain_id).order_by(DomainEvent.event_date.desc()).all()

@router.post("/", response_model=DomainEventRead, status_code=201)
def create_event(event_in: DomainEventCreate, db: Session = Depends(get_db)):
    new_event = DomainEvent(**event_in.model_dump())
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    return new_event