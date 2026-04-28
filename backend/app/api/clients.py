from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import require_role
from app.db.session import get_db
from app.models.client import Client
from app.schemas.client import ClientCreate, ClientRead, ClientUpdate

router = APIRouter(prefix="/clients", tags=["Clients"])


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
    client = Client(
        name=client_in.name,
        contact_person=client_in.contact_person,
        email=client_in.email,
        phone=client_in.phone,
        user_id=client_in.user_id,
    )
    db.add(client)
    db.commit()
    db.refresh(client)
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
    for field, value in update_data.items():
        setattr(client, field, value)

    db.add(client)
    db.commit()
    db.refresh(client)
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

    client.is_deleted = True
    db.add(client)
    db.commit()
    return None