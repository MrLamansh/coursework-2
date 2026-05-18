from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import csv
import io
from datetime import datetime, timedelta
from typing import Optional
from urllib.parse import quote

from app.db.session import get_db
from app.models.domain import Domain
from app.models.contract import Contract
from app.models.client import Client
from app.models.payment import Payment
from app.core.deps import require_role, get_current_user
from app.models.user import User

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.post("/export")
def export_report(
    report_type: str = Query(..., description="Type: domains, expiring, client_payments"),
    client_id: Optional[int] = Query(None, description="Filter by client_id"),
    days: int = Query(30, description="Days to expiration for 'expiring' report"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("manager")),
):

    if report_type == "domains":
        rows = _get_domains_data(db)
        filename = "domains.csv"
    elif report_type == "expiring":
        rows = _get_expiring_domains_data(db, days)
        filename = "expiring_domains.csv"
    elif report_type == "client_payments":
        if not client_id:
            raise HTTPException(status_code=400, detail="client_id required for client_payments report")
        rows = _get_client_payments_data(db, client_id)
        filename = "client_payments.csv"
    else:
        raise HTTPException(status_code=400, detail="Unknown report_type")

    return _generate_csv(rows, filename)


def _get_domains_data(db: Session) -> list[dict]:
    domains = (
        db.query(Domain)
        .filter(Domain.is_deleted.is_(False))
        .all()
    )

    rows = []
    for d in domains:
        rows.append({
            "Домен": d.domain_name,
            "Клиент": d.contract.client.name if d.contract and d.contract.client else "N/A",
            "Регистратор": d.registrar.name if d.registrar else "N/A",
            "Дата регистрации": d.registration_date.strftime("%Y-%m-%d") if d.registration_date else "N/A",
            "Дата окончания": d.expiration_date.strftime("%Y-%m-%d") if d.expiration_date else "N/A",
            "Статус": d.status.name if d.status else "N/A",
        })
    return rows


def _get_expiring_domains_data(db: Session, days: int) -> list[dict]:
    threshold = datetime.now() + timedelta(days=days)

    domains = (
        db.query(Domain)
        .filter(
            Domain.is_deleted.is_(False),
            Domain.expiration_date <= threshold,
            Domain.expiration_date > datetime.now()
        )
        .order_by(Domain.expiration_date)
        .all()
    )

    rows = []
    for d in domains:
        days_left = (d.expiration_date - datetime.now()).days
        rows.append({
            "Домен": d.domain_name,
            "Клиент": d.contract.client.name if d.contract and d.contract.client else "N/A",
            "Регистратор": d.registrar.name if d.registrar else "N/A",
            "Дата окончания": d.expiration_date.strftime("%Y-%m-%d") if d.expiration_date else "N/A",
            "Дней осталось": str(days_left),
            "Статус": d.status.name if d.status else "N/A",
        })
    return rows


def _get_client_payments_data(db: Session, client_id: int) -> list[dict]:
    payments = (
        db.query(Payment)
        .join(Contract)
        .filter(
            Contract.client_id == client_id,
            Payment.is_deleted.is_(False)
        )
        .all()
    )

    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        return []

    rows = []
    for p in payments:
        rows.append({
            "Клиент": client.name,
            "Сумма": str(p.amount),
            "Валюта": "RUB",
            "Дата платежа": p.payment_date.strftime("%Y-%m-%d") if p.payment_date else "N/A",
            "Тип": p.payment_type.name if p.payment_type else "N/A",
            "Статус": p.payment_status.name if p.payment_status else "N/A",
        })
    return rows


def _generate_csv(rows: list[dict], filename: str) -> StreamingResponse:
    output = io.BytesIO()

    if not rows:
        fieldnames = ["Результат"]
        rows = [{"Результат": "Нет данных"}]
    else:
        fieldnames = list(rows[0].keys())

    text = io.TextIOWrapper(output, encoding='utf-8-sig', newline='')
    writer = csv.DictWriter(text, fieldnames=fieldnames, delimiter=";")
    writer.writeheader()
    for row in rows:
        writer.writerow(row)

    text.flush()
    text.detach()
    output.seek(0)

    encoded_filename = quote(filename, safe='')

    headers = {
        "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}",
    }
    return StreamingResponse(
        output,
        media_type="text/csv; charset=utf-8",
        headers=headers,
    )
