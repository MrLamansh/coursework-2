# Система управления доменами

Учебный проект курсовой работы по дисциплине
**«Разработка информационных систем для бизнеса»**

Стек проекта:
- Backend: FastAPI + SQLAlchemy + PostgreSQL
- Frontend: React + Vite + Material UI

## Структура проекта

```text
coursework-2/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── db/
│   │   ├── models/
│   │   ├── schemas/
│   │   └── services/
│   ├── migrations/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Как запустить backend

```powershell
Set-Location "C:\Users\koles\Desktop\my-telegram-app\coursework-2\backend"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Перед запуском нужен файл `.env` с параметрами БД и JWT, например:

```env
DATABASE_URL=postgresql+psycopg2://postgres:postgres@127.0.0.1:5432/domain_manager
SECRET_KEY=change-me
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

## Как запустить frontend

```powershell
Set-Location "C:\Users\koles\Desktop\my-telegram-app\coursework-2\frontend"
npm install
npm run dev
```

## Что реализовано

- авторизация по ролям: `manager`, `engineer`, `client`
- сущности: клиенты, договоры, домены, заявки, платежи
- справочники статусов и типов
- soft delete для основных сущностей
- ночная проверка доменов по расписанию
- экспорт отчётов

## Примечание для проверки

Для курсовой важнее всего, чтобы:
- приложение запускалось без ошибок;
- роли и доступы работали корректно;
- soft delete не ломал связи;
- статусы доменов синхронизировались с `expiration_date`;
- клиент видел только свои данные.

## Автор

Колесников Андрей
