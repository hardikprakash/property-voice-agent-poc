# Property Voice Agent PoC Foundation

## Product Goal

Build a local-first, mobile-optimized web app for property brokers where call recordings are converted into draft calendar actions linked to properties, buyers, and sellers.

The PoC is successful if a broker can record or upload a call, let the system extract likely follow-up actions, review the proposed events, edit them if needed, and save them into an in-app calendar.

## Problem Framing

Brokers manage many overlapping conversations across properties, sellers, and buyers. The operational burden is not the call itself, but remembering and recording the next action correctly:

- follow up with a buyer after a few days
- schedule a property visit
- ask a seller to clarify documents or formalities
- reply to a buyer after checking seller-side details

These actions are currently tracked manually and can be missed, mis-scoped, or delayed.

## PoC Product Interpretation

This PoC should be treated as a voice-to-draft-actions workflow, not a fully autonomous conversational assistant.

The system should:

- accept audio from browser recording or file upload
- transcribe the audio
- extract structured event suggestions from the transcript
- link those suggestions to existing properties and contacts when possible
- require broker review before persistence
- create or update in-app calendar events after approval

The system should not yet:

- ask clarifying follow-up questions during the call
- sync with Google Calendar or iOS Calendar
- auto-commit actions without a review step
- act as a real-time voice assistant
- create a new buyer, seller, or property automatically unless explicitly added outside the voice flow

## Core Workflow

1. Broker logs into the app.
2. Broker sees upcoming events, recent processed recordings, and a prominent record or upload action.
3. Broker records a call in the browser or uploads an audio file.
4. Backend stores the audio locally and generates a transcript.
5. AI extracts:
   - transcript summary
   - candidate property and contact references
   - suggested calendar actions
   - confidence or unresolved linkage notes
6. Broker lands on a review screen.
7. Broker edits any missing fields such as property, participant, due date, visit time, or action title.
8. Broker approves the draft actions.
9. App creates the final events in the in-app calendar.

## Domain Model For The PoC

Recommended entities:

- Broker
- Property
- Contact
- PropertyContactLink
- CalendarEvent
- AudioRecording
- Transcript
- ExtractionRun
- DraftAction

Recommended modeling notes:

- A Contact can play different roles across properties, so buyer and seller should be relationship roles, not separate base entities.
- CalendarEvent should be the only record created from the voice flow in the initial PoC.
- DraftAction should store the model output before approval so the review step is auditable.
- AudioRecording and Transcript should be persisted so extraction quality can be debugged later.

## Scope To Lock For Phase 1

### Included

- multi-broker accounts with login
- local storage for database and uploaded audio
- browser microphone recording
- file upload for audio recordings
- English-only transcription
- transcript generation for completed recordings
- extraction of draft events from transcript text
- mandatory review and edit screen before save
- in-app calendar views for created events
- manual CRUD for brokers, properties, contacts, and events through the UI
- mobile-first responsive UI optimized for smartphone browsers

### Explicitly Out Of Scope

- Google, Apple, or Outlook calendar sync
- WhatsApp, email, or telephony integrations
- real-time streaming voice conversation with the broker
- multilingual transcription
- fully autonomous action execution without review
- auto-creation of new contacts or properties from raw voice alone
- background job orchestration unless later needed for longer files
- mobile app builds

## Critical Product Constraints

These are the constraints that keep the PoC tractable:

- The voice pipeline produces draft actions, not final truth.
- Entity resolution is allowed to be imperfect; unresolved items must be surfaced for manual selection.
- Audio is processed after recording ends or after file upload completes.
- The app is smartphone-first and must remain usable on desktop.

## Recommended Technical Stack

### Recommendation

- Frontend: React + TypeScript + Vite
- UI: Tailwind CSS + a small component layer
- Data fetching: TanStack Query
- Backend: FastAPI
- Validation and schemas: Pydantic
- Database: SQLite locally, with SQLAlchemy or SQLModel
- Migrations: Alembic
- Auth: FastAPI-based JWT session flow with email and password for the PoC
- File storage: local filesystem under a project data directory
- Calendar UI: mobile-friendly agenda-first interface with month view as a secondary view
- AI reasoning and extraction: OpenRouter with a model that supports structured outputs
- Speech-to-text: dedicated transcription API, likely OpenAI transcriptions

### Why This Stack

- Python backend fits the current preference and is strong for orchestration, schema validation, and AI integration.
- React handles browser recording, review UI, and responsive mobile interaction more comfortably than server-rendered Python templates for this use case.
- SQLite keeps the PoC local and removes cloud setup overhead.
- OpenRouter works well for extraction because strict structured outputs reduce parsing failures.
- Speech transcription should be a separate service because OpenRouter is primarily a model routing layer for text and multimodal generation, not the clearest standalone transcription choice.

## AI Pipeline Recommendation

Use a two-stage pipeline:

1. Transcribe audio into raw text.
2. Run structured extraction on the transcript to produce draft actions.

Extraction output should include fields like:

- action type
- title
- description
- property reference
- contact reference
- contact role
- due date or scheduled datetime
- status
- confidence notes
- unresolved fields

Important implementation rule:

If the model cannot confidently identify the property or contact, it should return a null or unresolved value instead of guessing.

## Suggested Initial Screens

- Login
- Dashboard
- Record or Upload Audio
- Review Extracted Actions
- Calendar
- Properties
- Contacts

## Mobile UX Direction

Because brokers will use the app primarily on smartphones, the UI should be mobile-first.

- Prioritize one-hand use, large tap targets, and shallow navigation depth.
- Put record or upload actions on the home screen without requiring multi-step navigation.
- Treat agenda and upcoming tasks as the primary calendar experience on mobile.
- Keep month-grid calendar interactions secondary and optional on smaller screens.
- Make review and edit flows work reliably on narrow screens before refining desktop layouts.

## Suggested Milestones

1. Scaffold frontend, backend, local database, and auth.
2. Add manual CRUD for properties, contacts, and events.
3. Add browser recording and audio upload.
4. Add transcription storage.
5. Add structured extraction to draft actions.
6. Add review and approval flow.
7. Add calendar visualization and filtering.

## Build Principle For Follow-On Agents

Subsequent build agents should optimize for determinism and traceability over autonomy.

Preferred order of trust:

1. persisted user data
2. explicit user edits on the review screen
3. AI extraction output

If there is a conflict between AI output and known stored data, the UI should surface it for review instead of silently overwriting records.