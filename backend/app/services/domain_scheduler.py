import logging
from datetime import datetime

from sqlalchemy.orm import Session, joinedload

from app.models.domain import Domain
from app.models.event import DomainEvent
from app.models.request import Request
from app.models.contract import Contract

logger = logging.getLogger(__name__)


def run_daily_check(db: Session):
    logger.info("Запуск ночной проверки доменов...")
    now = datetime.utcnow()

    domains = (
        db.query(Domain)
        .options(joinedload(Domain.contract).joinedload(Contract.client))
        .filter(Domain.is_deleted.is_(False))
        .all()
    )

    created_count = 0

    for domain in domains:
        try:
            days_left = (domain.expiration_date - now).days
            print(f"[SCHEDULER] Домен: {domain.domain_name}, days_left: {days_left}")

            if days_left > 30 or days_left < 0:
                print(f"[SCHEDULER] {domain.domain_name} — пропускаем (days_left={days_left})")
                continue

            existing = (
                db.query(Request)
                .filter(
                    Request.domain_id == domain.id,
                    Request.is_deleted.is_(False),
                    Request.execution_status_id == 1
                )
                .first()
            )

            if existing:
                print(f"[SCHEDULER] {domain.domain_name}: заявка уже есть (id={existing.id}), пропускаем")
                continue

            print(f"[SCHEDULER] {domain.domain_name}: создаём заявку...")

            client_id = domain.contract.client_id if domain.contract else None
            if not client_id:
                print(f"[SCHEDULER] {domain.domain_name}: не удалось определить клиента, пропускаем")
                continue

            request_number = f"AUTO-{domain.id}-{now.strftime('%Y%m%d')}"
            description = (
                f"Автоматическая заявка: до истечения домена {domain.domain_name} "
                f"осталось {days_left} дней (истекает {domain.expiration_date.date()})."
            )

            new_request = Request(
                request_number=request_number,
                request_type_id=2,
                execution_status_id=1,
                client_id=client_id,
                contract_id=domain.contract_id,
                domain_id=domain.id,
                description=description,
                is_deleted=False,
                created_at=now,
                updated_at=now
            )
            db.add(new_request)

            event = DomainEvent(
                event_type_id=2,
                notes=f"Автозаявка {request_number} создана. Осталось {days_left} дней.",
                domain_id=domain.id,
                created_at=now
            )
            db.add(event)
            created_count += 1

        except Exception as e:
            print(f"[SCHEDULER] ❌ Ошибка при обработке домена {domain.domain_name}: {e}")
            continue

    db.commit()
    logger.info(f"Проверка завершена. Создано заявок: {created_count}")