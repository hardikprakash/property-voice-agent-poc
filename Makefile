PYTHON := ../.venv/bin/python
PIP := ../.venv/bin/pip
UVICORN := ../.venv/bin/uvicorn
ALEMBIC := ../.venv/bin/alembic
BACKEND_DIR := backend
FRONTEND_DIR := frontend

.PHONY: help venv backend-install backend-run backend-migrate backend-health backend-test frontend-install frontend-run frontend-build test validate

help:
	@echo "Available targets:"
	@echo "  make venv             - create a Python 3.12 virtual environment"
	@echo "  make backend-install  - install backend Python dependencies"
	@echo "  make backend-run      - run the FastAPI backend on port 8000"
	@echo "  make backend-migrate  - apply Alembic migrations"
	@echo "  make backend-health   - call the backend health endpoint"
	@echo "  make backend-test     - run the backend pytest suite"
	@echo "  make frontend-install - install frontend dependencies"
	@echo "  make frontend-run     - run the Vite dev server on port 5173"
	@echo "  make frontend-build   - build the frontend for production"
	@echo "  make test             - run automated tests and the frontend build"
	@echo "  make validate         - run tests plus migration and import checks"

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

backend-test:
	cd $(BACKEND_DIR) && PYTHONPATH=. $(PYTHON) -m pytest -q

frontend-install:
	cd $(FRONTEND_DIR) && npm install

frontend-run:
	cd $(FRONTEND_DIR) && npm run dev

frontend-build:
	cd $(FRONTEND_DIR) && npm run build

test: backend-test frontend-build

validate: test backend-migrate
	cd $(BACKEND_DIR) && $(PYTHON) -c "from app.main import app; print(app.title)"
