from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from app.services.domain_checker import check_whois
from app.models.event import DomainEvent
from app.services.domain_scheduler import run_daily_check

from app.core.deps import require_role
from app.db.session import get_db
from app.models.domain import Domain
from app.schemas.domain import DomainCreate, DomainRead, DomainUpdate
from app.models.contract import Contract
from datetime import datetime, timedelta

router = APIRouter(prefix="/domains", tags=["Domains"])


@router.get("/", response_model=list[DomainRead])
def list_domains(
        db: Session = Depends(get_db),
        # Если у тебя есть get_current_user, можешь добавить его сюда
):
    """
    Получить список всех доменов.
    Использует joinedload для подгрузки связанных данных (контракт, статус, регистратор).
    """
    domains = (
        db.query(Domain)
        .options(
            joinedload(Domain.status),
            joinedload(Domain.registrar),
            # Подгружаем контракт, а через него - клиента
            joinedload(Domain.contract).joinedload(Contract.client)
        )
        .filter(Domain.is_deleted.is_(False))
        .order_by(Domain.expiration_date)  # Сортируем по дате окончания, это логичнее
        .all()
    )
    return domains


@router.get("/expiring", response_model=list[DomainRead])
def get_expiring_domains(
        days: int = 30,
        db: Session = Depends(get_db),
):
    """
    Получить домены, у которых до истечения осталось не более `days` дней.
    По умолчанию: 30 дней.
    """
    threshold = datetime.utcnow() + timedelta(days=days)
    domains = (
        db.query(Domain)
        .options(
            joinedload(Domain.status),
            joinedload(Domain.registrar),
            joinedload(Domain.contract).joinedload(Contract.client)
        )
        .filter(
            Domain.is_deleted.is_(False),
            Domain.expiration_date <= threshold
        )
        .order_by(Domain.expiration_date)
        .all()
    )
    return domains


@router.get("/{domain_id}", response_model=DomainRead)
def get_domain(
        domain_id: int,
        db: Session = Depends(get_db),
):
    domain = (
        db.query(Domain)
        .options(
            joinedload(Domain.status),
            joinedload(Domain.registrar),
            joinedload(Domain.contract).joinedload(Contract.client)
        )
        .filter(Domain.id == domain_id, Domain.is_deleted.is_(False))
        .first()
    )
    if domain is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Domain not found",
        )
    return domain


@router.post("/", response_model=DomainRead, status_code=status.HTTP_201_CREATED)
def create_domain(
        domain_in: DomainCreate,
        db: Session = Depends(get_db),
):
    domain = Domain(**domain_in.model_dump())
    db.add(domain)

    try:
        db.commit()
        db.refresh(domain)
    except IntegrityError as e:
        db.rollback()
        error_msg = str(e.orig).lower()
        if "unique" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Domain with this name already exists"
            )
        if "foreign key" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid foreign key: check contract_id, registrar_id or status_id"
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database integrity error"
        )

    return domain


@router.put("/{domain_id}", response_model=DomainRead)
def update_domain(
        domain_id: int,
        domain_in: DomainUpdate,
        db: Session = Depends(get_db),
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

    update_data = domain_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(domain, field, value)

    try:
        db.add(domain)
        db.commit()
        db.refresh(domain)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database integrity error during update"
        )

    return domain


@router.delete("/{domain_id}", status_code=status.HTTP_204_NO_CONTENT)
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
    db.add(domain)
    db.commit()
    return None


@router.post("/{domain_id}/whois-check")
def whois_check(
        domain_id: int,
        db: Session = Depends(get_db),
):
    """
    Проверить домен через WHOIS и сравнить с данными в БД.
    Записывает событие в историю домена.
    """
    domain = (
        db.query(Domain)
        .filter(Domain.id == domain_id, Domain.is_deleted.is_(False))
        .first()
    )
    if not domain:
        raise HTTPException(status_code=404, detail="Domain not found")

    result = check_whois(domain.domain_name)

    if result["status"] == "error":
        raise HTTPException(
            status_code=502,
            detail=f"WHOIS error: {result['error']}"
        )

    whois_exp = result["expiration_date"]
    db_exp = domain.expiration_date

    mismatch = False
    if whois_exp and db_exp:
        mismatch = abs((whois_exp - db_exp).days) > 1

    note = f"WHOIS проверка. Дата у регистратора: {whois_exp}. В БД: {db_exp}."
    if mismatch:
        note += " ⚠️ РАСХОЖДЕНИЕ ДАННЫХ!"

    event = DomainEvent(
        event_type_id=1,
        event_date=datetime.utcnow(),
        notes=note,
        domain_id=domain.id,
        created_at=datetime.utcnow()
    )
    db.add(event)
    db.commit()

    return {
        "domain": domain.domain_name,
        "db_expiration": db_exp,
        "whois_expiration": whois_exp,
        "whois_registrar": result["registrar"],
        "mismatch": mismatch
    }

@router.post("/trigger-check", tags=["Debug"])
def trigger_check(db: Session = Depends(get_db)):
    """Ручной запуск ночной проверки доменов (для тестирования)."""
    run_daily_check(db)
    return {"status": "ok", "message": "Проверка выполнена, смотри логи и таблицу requests"}