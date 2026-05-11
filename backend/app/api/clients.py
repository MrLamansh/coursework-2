from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import DataError, IntegrityError
from sqlalchemy.orm import Session

from app.core.deps import require_role
from app.db.session import get_db
from app.models.client import Client
from app.models.contract import Contract
from app.models.domain import Domain
from app.models.user import User
from app.schemas.client import ClientCreate, ClientRead, ClientUpdate

router = APIRouter(prefix="/clients", tags=["Clients"])


def _validate_client_user_link(db: Session, user_id: int | None, current_client_id: int | None = None) -> None:
    """Проверка корректности привязки user_id к клиенту."""
    if user_id is None:
        return

    user = db.query(User).filter(User.id == user_id, User.is_deleted.is_(False)).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь для привязки не найден",
        )

    if user.role != "client":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Можно привязать только пользователя с ролью client",
        )

    existing_client = (
        db.query(Client)
        .filter(
            Client.user_id == user_id,
            Client.is_deleted.is_(False),
        )
        .first()
    )
    if existing_client and existing_client.id != current_client_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Этот пользователь уже привязан к другому клиенту",
        )


@router.get(
    "/",
    response_model=list[ClientRead],
    dependencies=[Depends(require_role("manager"))],
)
def list_clients(db: Session = Depends(get_db)):
    return (
        db.query(Client)
        .filter(Client.is_deleted.is_(False))
        .order_by(Client.id)
        .all()
    )


@router.get(
    "/{client_id}",
    response_model=ClientRead,
    dependencies=[Depends(require_role("manager"))],
)
def get_client(
    client_id: int,
    db: Session = Depends(get_db),
):
    client = (
        db.query(Client)
        .filter(Client.id == client_id, Client.is_deleted.is_(False))
        .first()
    )
    if client is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )
    return client


@router.post(
    "/",
    response_model=ClientRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role("manager"))],
)
def create_client(
    client_in: ClientCreate,
    db: Session = Depends(get_db),
):
    _validate_client_user_link(db, client_in.user_id)

    client = Client(
        name=client_in.name,
        contact_person=client_in.contact_person,
        email=client_in.email,
        phone=client_in.phone,
        inn=client_in.inn,
        user_id=client_in.user_id,
    )
    db.add(client)

    try:
        db.commit()
        db.refresh(client)
    except IntegrityError as exc:
        db.rollback()
        error_text = str(exc.orig).lower()
        if "unique" in error_text and "user_id" in error_text:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Этот пользователь уже привязан к другому клиенту",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ошибка целостности данных при создании клиента",
        )
    except DataError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Некорректные данные клиента. Проверьте формат полей",
        )

    return client


@router.put(
    "/{client_id}",
    response_model=ClientRead,
    dependencies=[Depends(require_role("manager"))],
)
def update_client(
    client_id: int,
    client_in: ClientUpdate,
    db: Session = Depends(get_db),
):
    client = (
        db.query(Client)
        .filter(Client.id == client_id, Client.is_deleted.is_(False))
        .first()
    )
    if client is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )

    update_data = client_in.model_dump(exclude_unset=True)

    if "user_id" in update_data:
        _validate_client_user_link(db, update_data["user_id"], current_client_id=client_id)

    for field, value in update_data.items():
        setattr(client, field, value)

    db.add(client)

    try:
        db.commit()
        db.refresh(client)
    except IntegrityError as exc:
        db.rollback()
        error_text = str(exc.orig).lower()
        if "unique" in error_text and "user_id" in error_text:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Этот пользователь уже привязан к другому клиенту",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ошибка целостности данных при обновлении клиента",
        )
    except DataError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Некорректные данные клиента. Проверьте формат полей",
        )

    return client


@router.delete(
    "/{client_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_role("manager"))],
)
def delete_client(
    client_id: int,
    db: Session = Depends(get_db),
):
    client = db.query(Client).filter(Client.id == client_id).first()
    if client is None or client.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )

    now = datetime.now()
    client.is_deleted = True

    # Собираем все договоры клиента для каскада на домены
    all_contract_ids = [
        contract_id
        for (contract_id,) in db.query(Contract.id)
        .filter(Contract.client_id == client.id)
        .all()
    ]

    # Каскадно помечаем активные договоры клиента как удалённые
    active_contract_ids = [
        contract_id
        for (contract_id,) in db.query(Contract.id)
        .filter(Contract.client_id == client.id, Contract.is_deleted.is_(False))
        .all()
    ]
    if active_contract_ids:
        db.query(Contract).filter(Contract.id.in_(active_contract_ids)).update(
            {
                Contract.is_deleted: True,
                Contract.updated_at: now,
            },
            synchronize_session=False,
        )

    if all_contract_ids:
        # Каскадно помечаем домены договоров клиента как удалённые
        db.query(Domain).filter(
            Domain.contract_id.in_(all_contract_ids),
            Domain.is_deleted.is_(False),
        ).update(
            {
                Domain.is_deleted: True,
                Domain.updated_at: now,
            },
            synchronize_session=False,
        )

    db.add(client)
    db.commit()
    return None