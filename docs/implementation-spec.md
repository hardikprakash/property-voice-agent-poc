# Property Voice Agent Implementation Spec

## Purpose

This document turns the PoC foundation into concrete implementation requirements for future build agents.

The target is a mobile-first web app for brokers who need to convert call recordings into reviewed in-app calendar events.

## Implementation Priorities

Build in this order:

1. stable data model and auth
2. manual CRUD for core business records
3. mobile-first UI shell
4. audio capture and upload
5. transcript persistence
6. AI extraction into draft actions
7. review and approval flow
8. calendar and dashboard polish

Do not start with AI-first scaffolding. The app needs deterministic records and manual workflows before the voice pipeline is layered in.

## System Architecture

### Frontend

- React + TypeScript + Vite
- Tailwind CSS
- TanStack Query
- React Router

Frontend responsibilities:

- authentication UI
- mobile-first navigation and layouts
- manual CRUD forms
- browser microphone recording
- file upload
- review and edit workflow for extracted draft actions
- calendar and agenda views

### Backend

- FastAPI
- Pydantic
- SQLAlchemy or SQLModel
- Alembic
- SQLite

Backend responsibilities:

- auth and broker isolation
- CRUD APIs for properties, contacts, and events
- audio file storage and metadata persistence
- transcript generation orchestration
- extraction run orchestration
- review payload generation
- final creation of calendar events from approved draft actions

### External AI Services

- speech-to-text provider for transcription
- OpenRouter for structured extraction from transcript text

AI requests must be wrapped behind internal services so providers can be swapped without rewriting route handlers.

## Core Entities

### Broker

Fields:

- id
- email
- password_hash
- full_name
- created_at
- updated_at

### Property

Fields:

- id
- broker_id
- title
- address_line_1
- address_line_2
- city
- state
- postal_code
- property_type
- notes
- is_active
- created_at
- updated_at

### Contact

Fields:

- id
- broker_id
- full_name
- phone_number
- email
- notes
- created_at
- updated_at

### PropertyContactLink

Purpose: connect a contact to a property with a role.

Fields:

- id
- broker_id
- property_id
- contact_id
- role
- notes
- created_at
- updated_at

Allowed initial roles:

- seller
- buyer
- tenant_candidate
- other

### CalendarEvent

Fields:

- id
- broker_id
- property_id
- contact_id
- title
- description
- event_type
- status
- starts_at
- ends_at
- due_at
- source
- source_recording_id
- source_draft_action_id
- created_at
- updated_at

Notes:

- Either `starts_at` or `due_at` may be used depending on whether the event is scheduled or task-like.
- `source` should distinguish manual events from AI-assisted events.

### AudioRecording

Fields:

- id
- broker_id
- original_filename
- storage_path
- mime_type
- file_size_bytes
- duration_seconds
- capture_source
- processing_status
- created_at
- updated_at

Allowed initial capture sources:

- browser_recording
- uploaded_file

### Transcript

Fields:

- id
- broker_id
- recording_id
- provider
- raw_text
- language_code
- created_at

Optional later fields:

- segments_json
- diarization_json
- confidence_json

### ExtractionRun

Fields:

- id
- broker_id
- recording_id
- transcript_id
- provider
- model
- prompt_version
- status
- raw_response_json
- created_at

### DraftAction

Fields:

- id
- broker_id
- extraction_run_id
- recording_id
- transcript_id
- property_id
- contact_id
- contact_role
- action_type
- title
- description
- starts_at
- ends_at
- due_at
- confidence_label
- unresolved_fields_json
- review_status
- created_at
- updated_at

`DraftAction` exists to preserve the model output before the broker approves or edits it.

## Mobile-First UX Requirements

These requirements are mandatory and should influence component and layout choices from the start.

- Design for a narrow viewport first, then expand upward.
- Primary actions must be reachable within one or two taps from the dashboard.
- Tap targets should be large enough for smartphone use.
- Important pages must avoid dense multi-column layouts on small screens.
- Forms should use stacked inputs on mobile.
- The main navigation should work well as a bottom tab bar or compact top navigation.
- The recording control must be prominent and easy to start, stop, and retry.
- Review screens must present one draft action at a time or a clearly separated card list.
- Agenda view is the default calendar view on mobile.
- Month view is secondary and should not be the primary planning interface on phones.
- Desktop support is required, but not at the cost of mobile usability.

## Frontend Routes

Initial routes:

- `/login`
- `/dashboard`
- `/recordings/new`
- `/recordings/:recordingId/review`
- `/calendar`
- `/properties`
- `/properties/:propertyId`
- `/contacts`
- `/contacts/:contactId`

The dashboard should be the operational home screen, not a marketing page.

## Backend API Surface

Recommended initial endpoints:

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Properties

- `GET /api/properties`
- `POST /api/properties`
- `GET /api/properties/{id}`
- `PATCH /api/properties/{id}`
- `DELETE /api/properties/{id}`

### Contacts

- `GET /api/contacts`
- `POST /api/contacts`
- `GET /api/contacts/{id}`
- `PATCH /api/contacts/{id}`
- `DELETE /api/contacts/{id}`

### Property Contact Links

- `POST /api/property-contact-links`
- `PATCH /api/property-contact-links/{id}`
- `DELETE /api/property-contact-links/{id}`

### Events

- `GET /api/events`
- `POST /api/events`
- `GET /api/events/{id}`
- `PATCH /api/events/{id}`
- `DELETE /api/events/{id}`

### Recordings And Voice Pipeline

- `POST /api/recordings/upload`
- `POST /api/recordings/browser`
- `GET /api/recordings`
- `GET /api/recordings/{id}`
- `POST /api/recordings/{id}/transcribe`
- `POST /api/recordings/{id}/extract-actions`
- `GET /api/recordings/{id}/draft-actions`
- `POST /api/draft-actions/{id}/approve`
- `PATCH /api/draft-actions/{id}`
- `POST /api/draft-actions/bulk-approve`

For the PoC, synchronous processing is acceptable for short recordings. If processing becomes slow, move the transcription and extraction steps behind queued jobs later.

## Voice Pipeline Contract

### Input

- one completed audio recording
- broker context
- broker-owned properties
- broker-owned contacts
- property-contact links

### Output

The extraction service should return structured draft actions only.

Each draft action should attempt to provide:

- action_type
- title
- description
- property_id or unresolved property reference
- contact_id or unresolved contact reference
- contact_role
- due_at or starts_at and ends_at
- confidence_label
- unresolved_fields

### Hard Rules

- Never guess a property or contact if the evidence is weak.
- Return unresolved fields explicitly instead of hallucinating values.
- Do not create persistent events directly from model output.
- Final persistence happens only after broker review.
- Store raw model output for debugging.

## Review Flow Requirements

The review screen is a core part of the product, not an admin afterthought.

It must allow the broker to:

- inspect transcript text
- inspect extracted draft actions
- edit title, description, property, contact, and dates
- delete incorrect draft actions
- approve one or many draft actions

The review screen should also surface:

- unresolved fields
- low-confidence extractions
- linkage mismatches between transcript and stored entities

## Calendar Requirements

Calendar is needed, but it should be designed around broker action management rather than generic scheduling.

Initial requirements:

- mobile-first agenda view
- upcoming events section on dashboard
- filters by property and contact
- support for both task-like follow-ups and scheduled visits
- event detail page or drawer

## Definitions Of Done

### Milestone 1

- auth works
- broker data is isolated
- database migrations run successfully
- mobile shell and routing exist

### Milestone 2

- broker can create and edit properties
- broker can create and edit contacts
- broker can link contacts to properties with roles
- broker can create manual calendar events

### Milestone 3

- broker can record audio in browser on smartphone and desktop
- broker can upload an audio file
- recording metadata is stored locally

### Milestone 4

- transcript is generated and stored
- transcript is viewable in the UI

### Milestone 5

- draft actions are generated with structured output
- unresolved fields are preserved
- raw extraction output is stored

### Milestone 6

- broker can review and edit draft actions on mobile
- approved draft actions create calendar events
- rejected or deleted draft actions are not persisted as events

## Non-Goals For Agents

Do not spend time on these unless the user explicitly expands scope:

- production-grade infra
- cloud deployment
- calendar provider integrations
- role-based teams beyond broker-level accounts
- realtime audio streaming conversations
- analytics dashboards
- advanced search

## Implementation Style

- Prefer simple service boundaries over early micro-abstractions.
- Keep schemas explicit and versioned.
- Use strong typing at API boundaries.
- Favor predictable CRUD and review workflows over agentic automation.
- When uncertain, preserve raw data and defer final judgment to the broker.