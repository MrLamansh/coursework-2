from datetime import UTC, datetime
from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.event import DomainEvent
from app.models.user import User
from app.schemas.event import DomainEventRead, DomainEventCreate
from app.core.deps import get_current_user, require_role

router = APIRouter(prefix="/events", tags=["Domain Events"])


@router.get("/domain/{domain_id}", response_model=List[DomainEventRead])
def get_events_for_domain(
    domain_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Получить историю событий для конкретного домена"""
    return (
        db.query(DomainEvent)
        .filter(DomainEvent.domain_id == domain_id)
        .order_by(DomainEvent.created_at.desc())
        .all()
    )


@router.post("/", response_model=DomainEventRead, status_code=status.HTTP_201_CREATED)
def create_event(
    event_in: DomainEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("manager")),
):
    new_event = DomainEvent(
        **event_in.model_dump(),
        created_at=datetime.now(UTC),
    )
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    return new_event