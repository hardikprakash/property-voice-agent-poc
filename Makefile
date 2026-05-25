PYTHON := ../.venv/bin/python
PIP := ../.venv/bin/pip
UVICORN := ../.venv/bin/uvicorn
ALEMBIC := ../.venv/bin/alembic
BACKEND_DIR := backend
FRONTEND_DIR := frontend

.PHONY: help venv backend-install backend-run backend-migrate backend-health frontend-install frontend-run frontend-build validate

help:
	@echo "Available targets:"
	@echo "  make venv             - create a Python 3.12 virtual environment"
	@echo "  make backend-install  - install backend Python dependencies"
	@echo "  make backend-run      - run the FastAPI backend on port 8000"
	@echo "  make backend-migrate  - apply Alembic migrations"
	@echo "  make backend-health   - call the backend health endpoint"
	@echo "  make frontend-install - install frontend dependencies"
	@echo "  make frontend-run     - run the Vite dev server on port 5173"
	@echo "  make frontend-build   - build the frontend for production"
	@echo "  make validate         - run the documented smoke checks"

venv:
	python3.12 -m venv .venv
	ln -sf python3.12 .venv/bin/python
	ln -sf python3.12 .venv/bin/python3

backend-install:
	cd $(BACKEND_DIR) && $(PIP) install -r requirements.txt

backend-run:
	cd $(BACKEND_DIR) && $(UVICORN) app.main:app --reload --host 127.0.0.1 --port 8000

backend-migrate:
	cd $(BACKEND_DIR) && $(ALEMBIC) -c alembic.ini upgrade head

backend-health:
	curl -s http://127.0.0.1:8000/api/health

frontend-install:
	cd $(FRONTEND_DIR) && npm install

frontend-run:
	cd $(FRONTEND_DIR) && npm run dev

frontend-build:
	cd $(FRONTEND_DIR) && npm run build

validate: frontend-build backend-migrate
	cd $(BACKEND_DIR) && $(PYTHON) -c "from app.main import app; print(app.title)"
