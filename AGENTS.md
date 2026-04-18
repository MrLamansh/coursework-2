# AGENTS.md - Руководство для AI агентов

## Архитектура проекта

Это двухслойное приложение управления доменами:

### Стек технологий
- **Backend**: FastAPI + SQLAlchemy ORM + PostgreSQL
- **Frontend**: Vanilla JS (HTML/CSS/JS)
- **БД**: PostgreSQL 15+, нормализована по 3NF
- **Планировщик**: APScheduler (ночная проверка доменов через WHOIS)

### Структура бэкенда
```
backend/
├── app/
│   ├── api/              # Маршруты (эндпоинты) по сущностям
│   ├── models/           # SQLAlchemy ORM модели
│   ├── schemas/          # Pydantic DTO схемы (валидация входа/выхода)
│   ├── services/         # Бизнес-логика (domain_checker, domain_scheduler)
│   ├── core/
│   │   ├── config.py     # Загрузка переменных из .env
│   │   ├── security.py   # JWT токены, хеширование паролей
│   │   └── deps.py       # Зависимости (get_current_user, require_role)
│   ├── db/
│   │   ├── base.py       # Base для всех моделей
│   │   └── session.py    # SQLAlchemy engine & SessionLocal
│   └── main.py           # FastAPI app, CORS, планировщик
├── migrations/           # Alembic для версионирования БД
└── requirements.txt      # Python зависимости
```

## Критические компоненты

### 1. Стартап сервера
```bash
# Из папки backend/
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- Загружает config из `.env`
- Инициализирует БД коннекшн через `SessionLocal`
- Запускает APScheduler для проверки доменов в 03:00 каждый день
- CORS настроен на `allow_origins=["*"]`

### 2. Таблицы БД (ключевые связи)
- `clients` - клиенты (has_many contracts)
- `contracts` - договоры (belongs_to clients, has_many domains)
- `domains` - домены (belongs_to contracts, registrars, domain_statuses)
- `domain_events` - история событий для доменов
- `registrars` - справочник регистраторов
- `domain_statuses` - справочник статусов доменов
- `users` - пользователи с ролями
- `payments` - платежи

### 3. Авторизация
- JWT токены (Bearer) в header `Authorization`
- Роли: "admin", "manager", "engineer"
- `require_role` middleware в `core/deps.py`
- Хеширование паролей через `bcrypt`

## Паттерны и соглашения

### Мягкое удаление (soft delete)
Все таблицы имеют `is_deleted: bool` колонку. При удалении через API обновляем флаг вместо физического удаления:
```python
# В эндпоинтах delete
obj.is_deleted = True
db.commit()

# В эндпоинтах get/list всегда фильтруем
.filter(Model.is_deleted.is_(False))
```

### ORM модели + Pydantic схемы
- **Модели** (в `models/`) - SQLAlchemy, отражают таблицы БД
- **Схемы** (в `schemas/`) - Pydantic, служат DTO для валидации входа/выхода
- **Маппинг**: `model_config = ConfigDict(from_attributes=True)` включает ORM mode

### API структура по сущностям
Каждый эндпоинт в `api/` файле содержит CRUD + специальные операции:
```python
@router.get("/", response_model=list[EntityRead])           # GET список
@router.get("/{id}", response_model=EntityRead)              # GET один
@router.post("/", response_model=EntityRead)                 # POST создание
@router.put("/{id}", response_model=EntityRead)              # PUT обновление
@router.delete("/{id}", status_code=204)                     # DELETE
@router.get("/special", ...)                                 # Спецоперации
```

### Обработка ошибок
- `HTTPException` для HTTP статусов (400, 401, 404, 500)
- `IntegrityError` ловится в эндпоинтах create/update для валидации FK и уникальности
- Детальные сообщения об ошибках в `detail` поле

## Ключевые файлы для редактирования

### Добавление нового эндпоинта
1. Добавь модель в `models/new_entity.py`
2. Добавь схему в `schemas/new_entity.py`
3. Создай маршруты в `api/new_entity.py`
4. Включи router в `main.py`: `app.include_router(new_entity_router)`
5. Создай миграцию: `alembic revision --autogenerate -m "description"`

### Изменение БД
Используем Alembic для версионирования:
```bash
cd backend
alembic revision --autogenerate -m "описание изменения"
alembic upgrade head
```

## Фронтенд интеграция (vanilla JS)

- Фронт находится в `frontend/`
- Все API запросы из JS идут на `http://127.0.0.1:8000/api/...`
- Обработка CORS на бэкенде (уже включена)
- Маппинг полей: JS использует `contact`, БД использует `contact_person`

## Внешние зависимости

- `whois` библиотека - для проверки WHOIS данных доменов
- `psycopg2-binary` - драйвер PostgreSQL
- `apscheduler` - фоновый планировщик задач

## Типичные ошибки и решения

| Ошибка | Причина | Решение |
|--------|---------|--------|
| `ModuleNotFoundError: config` | Классический Flask import issue | Убедись в загрузке `DATABASE_URL` из `.env` |
| `psycopg.OperationalError` | PostgreSQL не запущена | Запусти `docker run -d -p 5432:5432 postgres` или локальный PostgreSQL |
| `IntegrityError: foreign key` | Попытка создать запись с неправильным FK | Проверь что referenced entity существует и `is_deleted=False` |
| `N+1 query problem` | Не используется `joinedload` в запросах | Добавь `.options(joinedload(...))` для связанных данных |
| `CORS error in browser` | Frontend не может достучаться до API | Проверь CORS middleware и что оба запущены |

