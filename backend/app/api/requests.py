from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models.request import Request
from app.schemas.request import RequestRead, RequestCreate

router = APIRouter(prefix="/requests", tags=["Requests"])


@router.get("/", response_model=List[RequestRead])
def get_requests(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Request).filter(Request.is_deleted == False) \
        .order_by(Request.id).offset(skip).limit(limit).all()


@router.get("/{request_id}", response_model=RequestRead)
def get_request_by_id(request_id: int, db: Session = Depends(get_db)):
    req = db.query(Request).filter(Request.id == request_id, Request.is_deleted == False).first()
    if not req:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    return req


@router.post("/", response_model=RequestRead, status_code=201)
def create_request(request_in: RequestCreate, db: Session = Depends(get_db)):
    new_request = Request(**request_in.model_dump())
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    return new_request
