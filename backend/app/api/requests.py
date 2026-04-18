from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List

from app.db.session import get_db
from app.models.request import Request
from app.models.client import Client
from app.models.contract import Contract
from app.schemas.request import RequestRead, RequestCreate, RequestUpdate

router = APIRouter(prefix="/requests", tags=["Requests"])


@router.get("/", response_model=List[RequestRead])
def get_requests(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return (
        db.query(Request)
        .filter(Request.is_deleted.is_(False))
        .order_by(Request.created_date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/{request_id}", response_model=RequestRead)
def get_request_by_id(request_id: int, db: Session = Depends(get_db)):
    req = db.query(Request).filter(
        Request.id == request_id,
        Request.is_deleted.is_(False)
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    return req


@router.post("/", response_model=RequestRead, status_code=201)
def create_request(request_in: RequestCreate, db: Session = Depends(get_db)):
    now = datetime.utcnow()
    new_request = Request(
        **request_in.model_dump(),
        created_at=now,
        updated_at=now
    )
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    return new_request


@router.put("/{request_id}", response_model=RequestRead)
def update_request(
    request_id: int,
    request_in: RequestUpdate,
    db: Session = Depends(get_db)
):
    req = db.query(Request).filter(
        Request.id == request_id,
        Request.is_deleted.is_(False)
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Заявка не найдена")

    update_data = request_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(req, field, value)

    req.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(req)
    return req


@router.delete("/{request_id}", status_code=204)
def delete_request(request_id: int, db: Session = Depends(get_db)):
    req = db.query(Request).filter(
        Request.id == request_id,
        Request.is_deleted.is_(False)
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Заявка не найдена")

    req.is_deleted = True
    req.updated_at = datetime.utcnow()
    db.commit()
    return None