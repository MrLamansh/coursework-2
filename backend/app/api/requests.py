from datetime import datetime
from uuid import uuid4
from sqlalchemy.exc import IntegrityError

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models.request import Request
from app.models.client import Client
from app.models.contract import Contract
from app.models.domain import Domain
from app.models.user import User
from app.schemas.request import RequestRead, RequestCreate, RequestUpdate
from app.core.deps import get_current_user, require_role

router = APIRouter(prefix="/requests", tags=["Requests"])


def generate_request_number() -> str:
    year = datetime.utcnow().year
    return f"REQ-{year}-{uuid4().hex[:8].upper()}"


@router.get("/", response_model=List[RequestRead])
def get_requests(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        db.query(Request)
        .filter(Request.is_deleted.is_(False))
        .order_by(Request.created_at.desc())
    )

    if current_user.role == "engineer":
        query = query.filter(Request.assigned_engineer_id == current_user.id)
    elif current_user.role == "client":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для просмотра заявок",
        )

    return query.offset(skip).limit(limit).all()


@router.get("/{request_id}", response_model=RequestRead)
def get_request_by_id(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    req = (
        db.query(Request)
        .filter(Request.id == request_id, Request.is_deleted.is_(False))
        .first()
    )
    if not req:
        raise HTTPException(status_code=404, detail="Заявка не найдена")

    if current_user.role == "engineer" and req.assigned_engineer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для просмотра этой заявки",
        )

    if current_user.role == "client":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для просмотра заявок",
        )

    return req


@router.post("/", response_model=RequestRead, status_code=status.HTTP_201_CREATED)
def create_request(
    request_in: RequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("manager")),
):
    client = db.query(Client).filter(Client.id == request_in.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Клиент не найден")

    contract = db.query(Contract).filter(Contract.id == request_in.contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Договор не найден")

    if request_in.domain_id is not None:
        domain = db.query(Domain).filter(Domain.id == request_in.domain_id).first()
        if not domain:
            raise HTTPException(status_code=404, detail="Домен не найден")

    if request_in.assigned_engineer_id is not None:
        engineer = db.query(User).filter(User.id == request_in.assigned_engineer_id).first()
        if not engineer:
            raise HTTPException(status_code=404, detail="Инженер не найден")
        if engineer.role != "engineer":
            raise HTTPException(
                status_code=400,
                detail="Назначенный пользователь не является инженером",
            )

    now = datetime.utcnow()

    for _ in range(5):
        request_number = generate_request_number()
        new_request = Request(
            request_number=request_number,
            request_type_id=request_in.request_type_id,
            execution_status_id=request_in.execution_status_id,
            client_id=request_in.client_id,
            contract_id=request_in.contract_id,
            domain_id=request_in.domain_id,
            assigned_engineer_id=request_in.assigned_engineer_id,
            description=request_in.description,
            is_deleted=False,
            created_at=now,
            updated_at=now,
        )
        db.add(new_request)
        try:
            db.commit()
            db.refresh(new_request)
            return new_request
        except IntegrityError:
            db.rollback()

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Не удалось сгенерировать уникальный номер заявки",
    )

    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    return new_request


@router.put("/{request_id}", response_model=RequestRead)
def update_request(
    request_id: int,
    request_in: RequestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("manager")),
):
    req = (
        db.query(Request)
        .filter(Request.id == request_id, Request.is_deleted.is_(False))
        .first()
    )
    if not req:
        raise HTTPException(status_code=404, detail="Заявка не найдена")

    update_data = request_in.model_dump(exclude_unset=True)

    if "client_id" in update_data:
        client = db.query(Client).filter(Client.id == update_data["client_id"]).first()
        if not client:
            raise HTTPException(status_code=404, detail="Клиент не найден")

    if "contract_id" in update_data:
        contract = db.query(Contract).filter(Contract.id == update_data["contract_id"]).first()
        if not contract:
            raise HTTPException(status_code=404, detail="Договор не найден")

    if "domain_id" in update_data and update_data["domain_id"] is not None:
        domain = db.query(Domain).filter(Domain.id == update_data["domain_id"]).first()
        if not domain:
            raise HTTPException(status_code=404, detail="Домен не найден")

    if "assigned_engineer_id" in update_data and update_data["assigned_engineer_id"] is not None:
        engineer = db.query(User).filter(User.id == update_data["assigned_engineer_id"]).first()
        if not engineer:
            raise HTTPException(status_code=404, detail="Инженер не найден")
        if engineer.role != "engineer":
            raise HTTPException(
                status_code=400,
                detail="Назначенный пользователь не является инженером",
            )

    for field, value in update_data.items():
        setattr(req, field, value)

    req.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(req)
    return req


@router.delete("/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("manager")),
):
    req = (
        db.query(Request)
        .filter(Request.id == request_id, Request.is_deleted.is_(False))
        .first()
    )
    if not req:
        raise HTTPException(status_code=404, detail="Заявка не найдена")

    req.is_deleted = True
    req.updated_at = datetime.utcnow()
    db.commit()
    return None