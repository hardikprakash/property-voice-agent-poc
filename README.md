# Property Voice Agent PoC

Mobile-first PoC for property brokers. The app records or uploads calls, stores them locally, transcribes them later, extracts draft calendar actions, and requires broker review before anything is saved as a final event.

## Project Layout

- [backend](backend) - FastAPI, SQLite, SQLModel, Alembic
- [frontend](frontend) - React, TypeScript, Vite, Tailwind CSS
- [docs](docs) - product and implementation scope

## Requirements

- Node.js LTS
- Python 3.12
- `make` is supported and provides the quickest path for local setup and validation.

The workspace was set up to use a project-local Python virtual environment at [`.venv`](.venv). If the interpreter shim points at `/usr/bin/python`, relink it to `python3.12`.

## Setup

1. Create the Python environment if it does not already exist:

```bash
python3.12 -m venv .venv
ln -sf python3.12 .venv/bin/python
ln -sf python3.12 .venv/bin/python3
```

2. Install backend dependencies:

```bash
./.venv/bin/pip install -r backend/requirements.txt
```

3. Install frontend dependencies:

```bash
cd frontend
npm install
```

4. Copy the environment examples if you want to override defaults:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

5. Or use the Makefile targets instead of running individual commands:

```bash
make venv
make backend-install
make frontend-install
```

## Configuration

### Backend

The backend reads settings from environment variables or [backend/.env.example](backend/.env.example).

- `SECRET_KEY` - JWT signing secret
- `ACCESS_TOKEN_EXPIRE_MINUTES` - token lifetime in minutes
- `SQLITE_FILENAME` - SQLite filename under `backend/data`
- `DATA_DIR` - local data directory for SQLite and uploaded audio
- `FRONTEND_ORIGIN` - allowed browser origin for local development

Defaults point to `backend/data/app.db` and `backend/data/recordings`.

### Frontend

The frontend optionally reads `VITE_API_BASE_URL` from [frontend/.env.example](frontend/.env.example).

- Leave it unset for local development when Vite proxies `/api` to the backend.
- Set it explicitly if you run the frontend against a different backend host.

## Run

### Backend

From the repository root:

```bash
cd backend
../.venv/bin/uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Equivalent Makefile target:

```bash
make backend-run
```

The API will be available at `http://127.0.0.1:8000`.

### Frontend

From the repository root:

```bash
cd frontend
npm run dev
```

Equivalent Makefile target:

```bash
make frontend-run
```

The Vite app will be available at `http://127.0.0.1:5173` and proxies `/api` to the backend during local development.

## Validation

Current documented validation results:

- Frontend production build passed with `cd frontend && npm run build`.
- Backend imported successfully with `../.venv/bin/python -c "from app.main import app; print(app.title)"`.
- Backend health endpoint returned `{"status":"ok"}` from a running Uvicorn server.
- Alembic migration `0001_initial_schema` applied successfully with `../.venv/bin/alembic -c alembic.ini upgrade head`.

There is not yet a dedicated automated test suite in the repository. The current checks are build, import, health, and migration smoke tests.

If you want a single command that reruns the core build and migration checks, use:

```bash
make validate
```

## Notes

- The initial implementation is intentionally local-first and review-first.
- Voice transcription and structured extraction routes are stubbed for now and return `501 Not Implemented`.
