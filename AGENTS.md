# Agent Build Guide

## Read This First

Before making architectural decisions, read:

1. `docs/poc-foundation.md`
2. `docs/implementation-spec.md`

These documents define the intended product and the allowed PoC scope.

## Project Intent

This repository is for a mobile-first PoC web app used by property brokers.

The app accepts recorded calls, produces draft calendar actions, and requires broker review before creating final in-app events.

## Non-Negotiable Constraints

- Mobile-first UX is mandatory. Brokers will use the app primarily from smartphones.
- The voice pipeline produces draft actions, not final truth.
- Review before persistence is mandatory.
- Local-first storage is preferred for the PoC.
- Multi-broker support is required.
- English-only audio support is sufficient for phase 1.

## Preferred Stack

- Frontend: React + TypeScript + Vite
- Backend: FastAPI
- Database: SQLite
- ORM layer: SQLAlchemy or SQLModel
- Validation: Pydantic
- Migrations: Alembic
- AI extraction: OpenRouter structured outputs
- Speech-to-text: dedicated transcription provider

Do not replace the stack without a strong reason and explicit user approval.

## Build Order

Follow this order unless the user redirects:

1. project scaffolding
2. auth and broker isolation
3. core data model and migrations
4. manual CRUD for properties, contacts, and events
5. mobile navigation and dashboard shell
6. audio recording and upload
7. transcript storage
8. draft action extraction
9. review and approval flow
10. calendar and dashboard refinement

## Mobile UX Rules

- Start with narrow screens first.
- Avoid layouts that require desktop width to be usable.
- Treat agenda and task lists as the primary calendar experience.
- Make recording and review flows easy to use with one hand.
- Use large tap targets and simple stacked forms.
- Test every major screen at smartphone widths before considering the task done.

## Data And AI Rules

- Keep buyer and seller as relationship roles, not separate base entity tables.
- Persist recordings, transcripts, extraction runs, and draft actions for traceability.
- Never auto-create final events directly from model output.
- If property or contact matching is unclear, return unresolved fields and let the broker decide.
- Preserve raw provider output when useful for debugging.

## Implementation Guidance

- Prefer explicit schemas and predictable APIs.
- Keep the codebase simple and easy for later agents to extend.
- Avoid speculative abstractions or generic agent frameworks early.
- Write focused validations after each meaningful change.
- Do not widen scope by adding integrations or background systems unless needed.

## Definition Of Success

The PoC succeeds when a broker can:

1. sign in
2. manage properties and contacts
3. record or upload a call from a phone browser
4. get draft actions from the transcript
5. review and edit those drafts
6. save final events into the in-app calendar