from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserRead

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/", response_model=list[UserRead])
def get_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Получить список всех пользователей (менеджеров, инженеров, клиентов)
    """
    users = db.query(User).order_by(User.id).offset(skip).limit(limit).all()
    return users


@router.get("/{user_id}", response_model=UserRead)
def get_user_by_id(user_id: int, db: Session = Depends(get_db)):
    """
    Получить одного пользователя по его ID
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return user
