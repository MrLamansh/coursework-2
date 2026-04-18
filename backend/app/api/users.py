from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from starlette import status

from app.core.security import get_password_hash
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserRead, UserCreate

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


@router.post("/", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    Создать нового пользователя.
    Пароль будет автоматически захэширован перед сохранением в БД.
    """
    # Проверяем, не занято ли имя пользователя
    existing_user = db.query(User).filter(User.username == user_in.username).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Пользователь с таким именем уже существует"
        )

    # Создаем юзера, хешируя пароль
    new_user = User(
        username=user_in.username,
        password_hash=get_password_hash(user_in.password),  # Тут используем поле password_hash, как в твоей модели!
        role=user_in.role,
        is_active=user_in.is_active
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user