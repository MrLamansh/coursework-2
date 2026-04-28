# app/api/reports.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import csv
import io
from openpyxl import Workbook

from app.db.session import get_db
from app import models
from app.core.deps import require_role
from app.models.user import User

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/domains/export")
def export_domains(
    format: str = "csv",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("manager")),
):
    domains = (
        db.query(models.Domain)
        .join(models.Contract)
        .join(models.Client)
        .join(models.Registrar)
        .all()
    )

    rows: list[dict] = []
    for d in domains:
        rows.append(
            {
                "domain_name": d.domain_name,
                "client": d.contract.client.name if d.contract and d.contract.client else None,
                "registrar": d.registrar.name if d.registrar else None,
                "registration_date": d.registration_date.strftime("%Y-%m-%d"),
                "expiration_date": d.expiration_date.strftime("%Y-%m-%d"),
                "status": d.status.name if getattr(d, "status", None) else None,
            }
        )

    if format == "csv":
        return _export_domains_csv(rows)
    elif format in ("xlsx", "excel"):
        return _export_domains_excel(rows)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported format",
        )


def _export_domains_csv(rows: list[dict]) -> StreamingResponse:
    output = io.StringIO()

    if rows:
        fieldnames = list(rows[0].keys())
    else:
        fieldnames = [
            "domain_name",
            "client",
            "registrar",
            "registration_date",
            "expiration_date",
            "status",
        ]

    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    for row in rows:
        writer.writerow(row)

    output.seek(0)
    headers = {
        "Content-Disposition": 'attachment; filename="domains.csv"',
    }
    return StreamingResponse(
        output,
        media_type="text/csv; charset=utf-8",
        headers=headers,
    )


def _export_domains_excel(rows: list[dict]) -> StreamingResponse:
    wb = Workbook()
    ws = wb.active
    ws.title = "Domains"

    if rows:
        headers = list(rows[0].keys())
        ws.append(headers)
        for row in rows:
            ws.append([row[h] for h in headers])
    else:
        ws.append(
            [
                "domain_name",
                "client",
                "registrar",
                "registration_date",
                "expiration_date",
                "status",
            ]
        )

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    headers = {
        "Content-Disposition": 'attachment; filename="domains.xlsx"',
    }
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers,
    )