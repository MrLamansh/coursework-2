from datetime import datetime, timedelta
from typing import Any, cast

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from app.core.email_sender import send_email
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError

from app.core.deps import require_role, get_current_user
from app.db.session import get_db
from app.models.domain import Domain
from app.models.contract import Contract
from app.models.event import DomainEvent
from app.models.user import User
from app.models.client import Client
from app.schemas.domain import DomainCreate, DomainRead, DomainUpdate
from app.services.domain_checker import check_whois
from app.services.domain_scheduler import (
    run_daily_check,
    sync_all_domain_statuses,
    _sync_domain_status,
)

router = APIRouter(prefix="/domains", tags=["Domains"])


@router.get(
    "/my",
    response_model=list[DomainRead],
    dependencies=[Depends(require_role("client"))],
)
def get_my_domains(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Возвращает домены текущего клиента."""
    client = db.query(Client).filter(Client.user_id == current_user.id, Client.is_deleted.is_(False)).first()
    if not client:
        return []

    query = (
        db.query(Domain)
        .options(
            joinedload(Domain.status),
            joinedload(Domain.registrar),
            joinedload(Domain.contract).joinedload(Contract.client),
        )
        .filter(
            Domain.is_deleted.is_(False),
            Domain.contract.has(Contract.client_id == client.id),
        )
        .order_by(Domain.expiration_date)
    )
    return query.all()


@router.get(
    "/",
    response_model=list[DomainRead],
    dependencies=[Depends(require_role("manager", "engineer", "client"))],
)
def list_domains(
    contract_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        db.query(Domain)
        .options(
            joinedload(Domain.status),
            joinedload(Domain.registrar),
            joinedload(Domain.contract).joinedload(Contract.client),
        )
        .filter(Domain.is_deleted.is_(False))
    )

    if current_user.role == "client":
        client = db.query(Client).filter(Client.user_id == current_user.id, Client.is_deleted.is_(False)).first()
        if not client:
            return []
        query = query.filter(Domain.contract.has(Contract.client_id == client.id))

    if contract_id is not None:
        query = query.filter(getattr(Domain, "contract_id") == contract_id)

    domains = query.order_by(Domain.expiration_date).all()
    return domains


@router.get(
    "/expiring",
    response_model=list[DomainRead],
    dependencies=[Depends(require_role("manager", "engineer", "client"))],
)
def get_expiring_domains(
        days: int = 30,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    now = datetime.now()
    threshold = now + timedelta(days=days)
    query = (
        db.query(Domain)
        .options(
            joinedload(Domain.status),
            joinedload(Domain.registrar),
            joinedload(Domain.contract).joinedload(Contract.client),
        )
        .filter(
            Domain.is_deleted.is_(False),
            Domain.expiration_date >= now,
            Domain.expiration_date <= threshold,
        )
    )

    if current_user.role == "client":
        client = db.query(Client).filter(Client.user_id == current_user.id, Client.is_deleted.is_(False)).first()
        if not client:
            return []
        query = query.filter(Domain.contract.has(Contract.client_id == client.id))

    domains = query.order_by(Domain.expiration_date).all()
    return domains


@router.get(
    "/{domain_id}",
    response_model=DomainRead,
    dependencies=[Depends(require_role("manager", "engineer", "client"))],
)
def get_domain(
        domain_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    domain = (
        db.query(Domain)
        .options(
            joinedload(Domain.status),
            joinedload(Domain.registrar),
            joinedload(Domain.contract).joinedload(Contract.client),
        )
        .filter(Domain.id == domain_id, Domain.is_deleted.is_(False))
        .first()
    )
    if domain is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Domain not found",
        )

    if current_user.role == "client":
        client = db.query(Client).filter(Client.user_id == current_user.id, Client.is_deleted.is_(False)).first()
        if not client or domain.contract.client_id != client.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Доступ запрещён",
            )

    return domain


@router.post(
    "/",
    response_model=DomainRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role("manager"))],
)
def create_domain(
        domain_in: DomainCreate,
        db: Session = Depends(get_db),
):
    domain = Domain(**domain_in.model_dump())
    db.add(domain)

    try:
        db.flush()
        _sync_domain_status(cast(Any, domain), db)
        db.commit()
        db.refresh(domain)
    except IntegrityError as e:
        db.rollback()
        error_msg = str(e.orig).lower()
        if "unique" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Domain with this name already exists",
            )
        if "foreign key" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid foreign key: check contract_id, registrar_id or status_id",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database integrity error",
        )

    return domain


@router.put(
    "/{domain_id}",
    response_model=DomainRead,
    dependencies=[Depends(require_role("manager", "engineer"))],
)
def update_domain(
        domain_id: int,
        domain_in: DomainUpdate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    domain = (
        db.query(Domain)
        .filter(Domain.id == domain_id, Domain.is_deleted.is_(False))
        .first()
    )
    if domain is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Domain not found",
        )

    if current_user.role == "engineer":
        update_data = domain_in.model_dump(exclude_unset=True)
        allowed_fields = {"registration_date", "registrar_id"}
        forbidden_fields = set(update_data.keys()) - allowed_fields
        if forbidden_fields:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Engineer can only edit registration_date and registrar_id. Forbidden fields: {', '.join(forbidden_fields)}",
            )

    update_data = domain_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(domain, field, value)

    domain.updated_at = datetime.now()

    try:
        try:
            _sync_domain_status(cast(Any, domain), db)
        except Exception:
            pass

        db.add(domain)
        db.commit()
        db.refresh(domain)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database integrity error during update",
        )

    return domain


@router.delete(
    "/{domain_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_role("manager"))],
)
def delete_domain(
        domain_id: int,
        db: Session = Depends(get_db),
):
    domain = db.query(Domain).filter(Domain.id == domain_id).first()
    if domain is None or domain.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Domain not found",
        )

    domain.is_deleted = True
    domain.updated_at = datetime.now()
    db.add(domain)
    db.commit()
    return None


@router.post(
    "/{domain_id}/whois-check",
    dependencies=[Depends(require_role("manager", "engineer", "client"))],
)
def whois_check(
        domain_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    domain = (
        db.query(Domain)
        .filter(Domain.id == domain_id, Domain.is_deleted.is_(False))
        .first()
    )
    if not domain:
        raise HTTPException(status_code=404, detail="Domain not found")

    if current_user.role == "client":
        client = db.query(Client).filter(Client.user_id == current_user.id, Client.is_deleted.is_(False)).first()
        if not client or domain.contract.client_id != client.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Доступ запрещён",
            )

    result = check_whois(domain.domain_name)

    if result["status"] == "error":
        raise HTTPException(
            status_code=502,
            detail=f"WHOIS error: {result['error']}",
        )

    whois_exp = result["expiration_date"]
    db_exp = domain.expiration_date

    mismatch = False
    if whois_exp and db_exp:
        mismatch = abs((whois_exp - db_exp).days) > 1

    note = f"WHOIS проверка. Дата у регистратора: {whois_exp}. В БД: {db_exp}."
    if mismatch:
        note += "РАСХОЖДЕНИЕ ДАННЫХ!"

    event = DomainEvent(
        event_type_id=1,
        notes=note,
        domain_id=domain.id,
        created_at=datetime.now(),
    )
    db.add(event)
    db.commit()

    return {
        "domain": domain.domain_name,
        "db_expiration": db_exp,
        "whois_expiration": whois_exp,
        "whois_registrar": result["registrar"],
        "mismatch": mismatch,
    }


@router.post(
    "/expiring/notify",
    dependencies=[Depends(require_role("manager"))],
)
def notify_expiring_domains(
        days: int = 30,
        background_tasks: BackgroundTasks = None,
        db: Session = Depends(get_db),
):
    threshold = datetime.now() + timedelta(days=days)

    domains = (
        db.query(Domain)
        .options(
            joinedload(Domain.status),
            joinedload(Domain.registrar),
            joinedload(Domain.contract).joinedload(Contract.client),
        )
        .filter(
            Domain.is_deleted.is_(False),
            Domain.expiration_date <= threshold,
        )
        .order_by(Domain.expiration_date)
        .all()
    )

    notified = 0
    skipped = 0

    for domain in domains:
        client = domain.contract.client if domain.contract else None

        if not client or not client.email:
            skipped += 1
            continue

        subject = "Напоминание о продлении домена"
        body = (
            f"Здравствуйте, {client.contact_person or client.name}!\n\n"
            f"Напоминаем, что срок регистрации домена {domain.domain_name} "
            f"истекает {domain.expiration_date.strftime('%Y-%m-%d')}.\n"
            f"Рекомендуем своевременно продлить домен, чтобы избежать его деактивации.\n\n"
            f"С уважением,\n"
            f"служба поддержки"
        )

        background_tasks.add_task(send_email, client.email, subject, body)
        notified += 1

    return {
        "status": "ok",
        "message": "Уведомления поставлены в очередь на отправку",
        "notified": notified,
        "skipped": skipped,
        "days": days,
    }


@router.post(
    "/trigger-check",
    tags=["Debug"],
    dependencies=[Depends(require_role("manager", "engineer"))],
)
def trigger_check(db: Session = Depends(get_db)):
    run_daily_check(db)
    return {"status": "ok", "message": "Проверка выполнена, смотри логи и таблицу requests"}


@router.post(
    "/trigger-sync-statuses",
    tags=["Debug"],
    dependencies=[Depends(require_role("manager", "engineer"))],
)
def trigger_sync_statuses(db: Session = Depends(get_db)):
    updated_count = sync_all_domain_statuses(db)
    return {
        "status": "ok",
        "message": "Статусы доменов синхронизированы",
        "updated_count": updated_count,
    }
