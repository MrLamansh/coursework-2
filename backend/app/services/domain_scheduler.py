import logging
from datetime import datetime
import uuid

from sqlalchemy.orm import Session, joinedload

from app.models.domain import Domain
from app.models.event import DomainEvent
from app.models.request import Request
from app.models.contract import Contract
from app.models.directories import DomainStatus

logger = logging.getLogger(__name__)


def run_daily_check(db: Session):
    logger.info("Запуск ночной проверки доменов...")
    now = datetime.now()

    domains = (
        db.query(Domain)
        .options(joinedload(Domain.contract).joinedload(Contract.client))
        .filter(Domain.is_deleted.is_(False))
        .all()
    )

    created_count = 0

    for domain in domains:
        try:
            # Синхронизируем статус домена по дате истечения
            try:
                _sync_domain_status(domain, db, now)
            except Exception as e:
                logger.error(f"[SCHEDULER] Ошибка при синхронизации статуса для {domain.domain_name}: {e}")

            days_left = (domain.expiration_date - now).days
            logger.info(f"[SCHEDULER] Домен: {domain.domain_name}, days_left: {days_left}")

            if days_left > 30 or days_left < 0:
                logger.info(f"[SCHEDULER] {domain.domain_name} — пропускаем (days_left={days_left})")
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
                logger.info(f"[SCHEDULER] {domain.domain_name}: заявка уже есть (id={existing.id}), пропускаем")
                continue

            logger.info(f"[SCHEDULER] {domain.domain_name}: создаём заявку...")

            client_id = domain.contract.client_id if domain.contract else None
            if not client_id:
                logger.info(f"[SCHEDULER] {domain.domain_name}: не удалось определить клиента, пропускаем")
                continue

            logger.info(f"[SCHEDULER] {domain.domain_name}: создаём заявку...")
            description = (
                f"Автоматическая заявка: до истечения домена {domain.domain_name} "
                f"осталось {days_left} дней (истекает {domain.expiration_date.date()})."
            )

            # Генерируем уникальный номер заявки
            request_number = f"AUTO-{now.strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"

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
            logger.error(f"[SCHEDULER] ❌ Ошибка при обработке домена {domain.domain_name}: {e}")
            continue

    db.commit()
    logger.info(f"Проверка завершена. Создано заявок: {created_count}")


def _sync_domain_status(domain, db: Session, now: datetime | None = None):
    """Обновляет domain.current_status_id в соответствии с правилами по expiration_date.

    Правила:
    - expiration_date > CURRENT_DATE -> 'Активен'
    - expiration_date < CURRENT_DATE -> 'Просрочен'
    - expiration_date == CURRENT_DATE -> 'Истекает сегодня' (создаётся если отсутствует)
    """
    if now is None:
        now = datetime.now()

    today = now.date()
    exp_date = domain.expiration_date.date()

    if exp_date > today:
        target_name = "Активен"
    elif exp_date < today:
        target_name = "Просрочен"
    else:
        target_name = "Истекает сегодня"

    status_obj = db.query(DomainStatus).filter(DomainStatus.name == target_name).first()
    # Создаём статус только для 'Истекает сегодня', другие статусы ожидаются существующими
    if status_obj is None and target_name == "Истекает сегодня":
        status_obj = DomainStatus(name=target_name)
        db.add(status_obj)
        db.flush()

    if status_obj is None:
        # Не смогли найти соответствующий статус — логируем и пропускаем
        logger.warning(f"[SCHEDULER] Статус '{target_name}' не найден в domain_statuses, пропускаем обновление статуса для {domain.domain_name}")
        return

    if domain.current_status_id != status_obj.id:
        old = domain.current_status_id
        domain.current_status_id = status_obj.id
        db.add(domain)
        # Добавляем событие об изменении статуса
        try:
            ev = DomainEvent(
                event_type_id=3,
                notes=f"Статус домена обновлён автопроцессом: {old} -> {status_obj.id}",
                domain_id=domain.id,
                created_at=now,
            )
            db.add(ev)
        except Exception:
            pass
