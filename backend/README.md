# Backend

FastAPI backend for the Property Voice Agent PoC.

## Install

From the repository root:

```bash
../.venv/bin/pip install -r backend/requirements.txt
```

Or from the repository root:

```bash
make backend-install
```

## Run

```bash
../.venv/bin/uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Or from the repository root:

```bash
make backend-run
```

## Configure

See [backend/.env.example](.env.example) for the supported environment variables.

## Migrations

Run Alembic from the backend directory:

```bash
../.venv/bin/alembic -c alembic.ini upgrade head
```

Or from the repository root:

```bash
make backend-migrate
```

## Validation

- API import check passed.
- `/api/health` returned `{"status":"ok"}` during the smoke test.
- Initial Alembic migration applied successfully.
