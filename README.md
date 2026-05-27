# Property Voice Agent PoC

Mobile-first PoC for property brokers. The app records or uploads calls, stores them locally, transcribes them into a review surface, extracts draft calendar actions, and requires broker review before anything is saved as a final event. It also supports quick typed notes that enter the same extraction review flow without a transcription step.

## Project Layout

- [backend](backend) - FastAPI, SQLite, SQLModel, Alembic, pytest
- [frontend](frontend) - React, TypeScript, Vite, Tailwind CSS, TanStack Query
- [docs](docs) - product and implementation scope

## Current MVP

- broker registration and login
- property CRUD
- contact CRUD
- buyer and seller linking to properties
- manual calendar event creation and deletion
- audio upload and browser microphone recording
- quick typed-note capture that skips transcription
- transcript generation route with `stub` and `openai` provider paths
- transcript editing in the review screen
- draft action extraction with `stub` and `openrouter` provider paths
- per-action save, discard, approve, and bulk approve flows
- dashboard cards for recent recordings and upcoming events

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

There is also a root [`.env.example`](.env.example) as a single reference sheet for all supported variables. The app reads `backend/.env` and `frontend/.env.local`, not the root file directly.

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
- `DATA_DIR` - local data directory for SQLite and uploaded audio; use `data` in `backend/.env` or an absolute path
- `FRONTEND_ORIGIN` - allowed browser origin for local development

Defaults point to `backend/data/app.db` and `backend/data/recordings`.

Additional AI-related configuration:

- `TRANSCRIPTION_PROVIDER` - `stub` or `openai`; defaults to `stub`
- `TRANSCRIPTION_MODEL` - model name sent to the transcription provider
- `TRANSCRIPTION_BASE_URL` - defaults to `https://api.openai.com/v1`
- `TRANSCRIPTION_API_KEY` - required when `TRANSCRIPTION_PROVIDER=openai`
- `TRANSCRIPTION_TIMEOUT_SECONDS` - HTTP timeout for transcription calls
- `TRANSCRIPTION_LANGUAGE_CODE` - defaults to `en`
- `EXTRACTION_PROVIDER` - `stub` or `openrouter`; defaults to `stub`
- `EXTRACTION_MODEL` - model name sent to OpenRouter for structured extraction
- `EXTRACTION_BASE_URL` - defaults to `https://openrouter.ai/api/v1`
- `EXTRACTION_API_KEY` - required when `EXTRACTION_PROVIDER=openrouter`
- `EXTRACTION_TIMEOUT_SECONDS` - HTTP timeout for extraction calls
- `EXTRACTION_PROMPT_VERSION` - prompt contract version stored with each extraction run
- `OPENROUTER_SITE_URL` - optional `HTTP-Referer` header for OpenRouter requests
- `OPENROUTER_APP_NAME` - optional `X-Title` header for OpenRouter requests

With the default stub providers, the app still works end to end with no paid APIs configured:

- `POST /api/recordings/{id}/transcribe` creates an editable placeholder transcript
- `POST /api/recordings/{id}/extract-actions` runs deterministic local extraction rules
- later you can switch providers without changing the frontend workflow

If you want live providers later, a minimal backend setup looks like this:

```env
TRANSCRIPTION_PROVIDER=openai
TRANSCRIPTION_MODEL=gpt-4o-mini-transcribe
TRANSCRIPTION_API_KEY=your-openai-key

EXTRACTION_PROVIDER=openrouter
EXTRACTION_MODEL=openai/gpt-4.1-mini
EXTRACTION_API_KEY=your-openrouter-key
```

The review screen and approval workflow remain the same for both stub and live provider modes.

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

## Demo Data

To populate the local SQLite database with realistic sample entries for frontend review, run:

```bash
make backend-seed-demo
```

This creates a dedicated demo broker and reseeds only that broker's data, leaving other accounts untouched.

- Login email: `demo@propertyvoice.local`
- Login email: `demo@propertyvoice.example.com`
- Password: `demo12345`

The seeded dataset includes:

- multiple properties across different cities and property types
- buyers, sellers, and a supporting contact with relationship links
- recordings in `uploaded`, `transcribed`, and `extracted` states
- a quick-note recording that skips transcription
- pending, approved, and discarded draft actions
- manual and AI-generated events in both open and completed states

## Validation

Current validation commands:

- Backend automated tests: `cd backend && PYTHONPATH=. ../.venv/bin/pytest -q`
- Frontend production build: `cd frontend && npm run build`
- Backend import smoke check: `cd backend && ../.venv/bin/python -c "from app.main import app; print(app.title)"`
- Alembic migration: `cd backend && ../.venv/bin/alembic -c alembic.ini upgrade head`

The backend pytest suite covers authentication, broker data isolation, and the end-to-end voice flow from recording upload to draft-action approval.

If you want a single command that reruns the core build and migration checks, use:

```bash
make validate
```

## Notes

- The initial implementation is intentionally local-first and review-first.
- The current providers are local stubs so the workflow is usable before API credits are added.
- When paid providers are configured later, keep the review step mandatory.
