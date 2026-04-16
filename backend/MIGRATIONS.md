# Alembic migrations

This backend uses Alembic with SQLAlchemy models from `app.models` and metadata from `app.db.base.Base`.

## One-time setup for an existing database

Run from `backend/`:

```powershell
python -m alembic revision -m "baseline_existing_schema"
python -m alembic stamp head
```

`stamp head` marks the current PostgreSQL schema as already migrated, without applying DDL.

## Regular workflow

1. Update SQLAlchemy models in `app/models`.
2. Generate a migration:

```powershell
python -m alembic revision --autogenerate -m "describe_change"
```

3. Review the generated file in `migrations/versions/`.
4. Apply migration:

```powershell
python -m alembic upgrade head
```

## Useful commands

```powershell
python -m alembic current
python -m alembic history
python -m alembic downgrade -1
```

