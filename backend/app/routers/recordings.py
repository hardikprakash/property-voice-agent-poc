import json
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlmodel import Session, select

from app.api.deps import get_current_broker
from app.api.serializers import as_draft_action_read, as_event_read, as_extraction_run_read, as_recording_read, as_transcript_read
from app.api.utils import apply_updates, latest_transcript, owned_or_404, parse_unresolved_fields
from app.core.config import get_settings
from app.db import get_session
from app.models import AudioRecording, Broker, CalendarEvent, Contact, DraftAction, ExtractionRun, Property, PropertyContactLink, Transcript, utcnow
from app.services.voice import VoiceProviderError, generate_draft_candidates, generate_transcript_text
from app.schemas import AudioRecordingRead, BulkApproveRequest, CalendarEventRead, DraftActionRead, DraftActionUpdate, ExtractionResultRead, QuickNoteCreate, TranscriptRead, TranscriptUpdate


settings = get_settings()
router = APIRouter(prefix="/api", tags=["recordings"])


async def save_uploaded_recording(
    upload: UploadFile,
    capture_source: str,
    current_broker: Broker,
    session: Session,
    duration_seconds: int | None,
) -> AudioRecording:
    file_bytes = await upload.read()
    original_filename = Path(upload.filename or "recording.bin").name
    recording = AudioRecording(
        broker_id=current_broker.id,
        original_filename=original_filename,
        storage_path="",
        mime_type=upload.content_type or "application/octet-stream",
        file_size_bytes=len(file_bytes),
        duration_seconds=duration_seconds,
        capture_source=capture_source,
        processing_status="uploaded",
    )

    storage_dir = settings.recording_dir / current_broker.id
    storage_dir.mkdir(parents=True, exist_ok=True)
    storage_path = storage_dir / f"{recording.id}_{original_filename}"
    storage_path.write_bytes(file_bytes)
    recording.storage_path = str(storage_path)

    session.add(recording)
    session.commit()
    session.refresh(recording)
    return recording


def create_quick_note_recording(session: Session, current_broker: Broker, raw_text: str) -> AudioRecording:
    note_text = raw_text.strip()
    if not note_text:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Note text is required")

    title = " ".join(note_text.splitlines()[0].split())[:48] or "Quick note"
    recording = AudioRecording(
        broker_id=current_broker.id,
        original_filename=title,
        storage_path="",
        mime_type="text/plain",
        file_size_bytes=len(note_text.encode("utf-8")),
        duration_seconds=None,
        capture_source="text_note",
        processing_status="transcribed",
    )
    transcript = Transcript(
        broker_id=current_broker.id,
        recording_id=recording.id,
        provider="manual_note",
        raw_text=note_text,
        language_code="en",
    )

    session.add(recording)
    session.add(transcript)
    session.commit()
    session.refresh(recording)
    return recording


def create_transcript(session: Session, recording: AudioRecording, broker_id: str) -> Transcript:
    existing = latest_transcript(session, recording.id)
    transcript_text = generate_transcript_text(recording, settings)
    if existing is not None:
        existing.provider = settings.transcription_provider
        existing.raw_text = transcript_text
        existing.language_code = "en"
        session.add(existing)
        transcript = existing
    else:
        transcript = Transcript(
            broker_id=broker_id,
            recording_id=recording.id,
            provider=settings.transcription_provider,
            raw_text=transcript_text,
            language_code="en",
        )
        session.add(transcript)

    recording.processing_status = "transcribed"
    recording.updated_at = utcnow()
    session.add(recording)
    session.commit()
    session.refresh(transcript)
    session.refresh(recording)
    return transcript


def create_calendar_event_from_draft_action(session: Session, current_broker: Broker, draft_action: DraftAction) -> CalendarEvent:
    if draft_action.starts_at is None and draft_action.due_at is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Draft action requires starts_at or due_at before approval")
    if draft_action.property_id is not None:
        owned_or_404(session, Property, draft_action.property_id, current_broker.id)
    if draft_action.contact_id is not None:
        owned_or_404(session, Contact, draft_action.contact_id, current_broker.id)

    existing = session.exec(select(CalendarEvent).where(CalendarEvent.source_draft_action_id == draft_action.id)).first()
    if existing is not None:
        return existing

    event = CalendarEvent(
        broker_id=current_broker.id,
        property_id=draft_action.property_id,
        contact_id=draft_action.contact_id,
        title=draft_action.title,
        description=draft_action.description,
        event_type=draft_action.action_type,
        status="scheduled" if draft_action.starts_at else "pending",
        starts_at=draft_action.starts_at,
        ends_at=draft_action.ends_at,
        due_at=draft_action.due_at,
        source="ai_draft",
        source_recording_id=draft_action.recording_id,
        source_draft_action_id=draft_action.id,
    )
    session.add(event)
    draft_action.review_status = "approved"
    draft_action.updated_at = utcnow()
    session.add(draft_action)
    session.commit()
    session.refresh(event)
    return event


@router.post("/recordings/upload", response_model=AudioRecordingRead, status_code=status.HTTP_201_CREATED)
async def upload_recording(
    file: UploadFile = File(...),
    duration_seconds: int | None = Form(default=None),
    current_broker: Broker = Depends(get_current_broker),
    session: Session = Depends(get_session),
) -> AudioRecordingRead:
    recording = await save_uploaded_recording(file, "uploaded_file", current_broker, session, duration_seconds)
    return as_recording_read(recording)


@router.post("/recordings/browser", response_model=AudioRecordingRead, status_code=status.HTTP_201_CREATED)
async def browser_recording(
    file: UploadFile = File(...),
    duration_seconds: int | None = Form(default=None),
    current_broker: Broker = Depends(get_current_broker),
    session: Session = Depends(get_session),
) -> AudioRecordingRead:
    recording = await save_uploaded_recording(file, "browser_recording", current_broker, session, duration_seconds)
    return as_recording_read(recording)


@router.post("/recordings/note", response_model=AudioRecordingRead, status_code=status.HTTP_201_CREATED)
def create_quick_note(
    payload: QuickNoteCreate,
    current_broker: Broker = Depends(get_current_broker),
    session: Session = Depends(get_session),
) -> AudioRecordingRead:
    recording = create_quick_note_recording(session, current_broker, payload.raw_text)
    return as_recording_read(recording)


@router.get("/recordings", response_model=list[AudioRecordingRead])
def list_recordings(
    current_broker: Broker = Depends(get_current_broker),
    session: Session = Depends(get_session),
) -> list[AudioRecordingRead]:
    rows = session.exec(
        select(AudioRecording).where(AudioRecording.broker_id == current_broker.id).order_by(AudioRecording.created_at.desc())
    ).all()
    return [as_recording_read(row) for row in rows]


@router.get("/recordings/{recording_id}", response_model=AudioRecordingRead)
def get_recording(
    recording_id: str,
    current_broker: Broker = Depends(get_current_broker),
    session: Session = Depends(get_session),
) -> AudioRecordingRead:
    return as_recording_read(owned_or_404(session, AudioRecording, recording_id, current_broker.id))


@router.get("/recordings/{recording_id}/transcript", response_model=TranscriptRead)
def get_recording_transcript(
    recording_id: str,
    current_broker: Broker = Depends(get_current_broker),
    session: Session = Depends(get_session),
) -> TranscriptRead:
    owned_or_404(session, AudioRecording, recording_id, current_broker.id)
    transcript = latest_transcript(session, recording_id)
    if transcript is None or transcript.broker_id != current_broker.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transcript not found")
    return as_transcript_read(transcript)


@router.patch("/transcripts/{transcript_id}", response_model=TranscriptRead)
def update_transcript(
    transcript_id: str,
    payload: TranscriptUpdate,
    current_broker: Broker = Depends(get_current_broker),
    session: Session = Depends(get_session),
) -> TranscriptRead:
    transcript = owned_or_404(session, Transcript, transcript_id, current_broker.id)
    transcript.raw_text = payload.raw_text
    transcript.language_code = payload.language_code or transcript.language_code
    session.add(transcript)
    session.commit()
    session.refresh(transcript)
    return as_transcript_read(transcript)


@router.post("/recordings/{recording_id}/transcribe", response_model=TranscriptRead)
def transcribe_recording(
    recording_id: str,
    current_broker: Broker = Depends(get_current_broker),
    session: Session = Depends(get_session),
) -> TranscriptRead:
    recording = owned_or_404(session, AudioRecording, recording_id, current_broker.id)
    if recording.capture_source == "text_note":
        transcript = latest_transcript(session, recording.id)
        if transcript is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transcript not found")
        return as_transcript_read(transcript)
    try:
        transcript = create_transcript(session, recording, current_broker.id)
    except VoiceProviderError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    return as_transcript_read(transcript)


@router.post("/recordings/{recording_id}/extract-actions", response_model=ExtractionResultRead)
def extract_actions(
    recording_id: str,
    current_broker: Broker = Depends(get_current_broker),
    session: Session = Depends(get_session),
) -> ExtractionResultRead:
    recording = owned_or_404(session, AudioRecording, recording_id, current_broker.id)
    transcript = latest_transcript(session, recording_id)
    if transcript is None:
        try:
            transcript = create_transcript(session, recording, current_broker.id)
        except VoiceProviderError as exc:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc

    properties = session.exec(select(Property).where(Property.broker_id == current_broker.id)).all()
    contacts = session.exec(select(Contact).where(Contact.broker_id == current_broker.id)).all()
    links = session.exec(select(PropertyContactLink).where(PropertyContactLink.broker_id == current_broker.id)).all()

    try:
        candidates, raw_response = generate_draft_candidates(transcript.raw_text, properties, contacts, links, settings)
    except VoiceProviderError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    extraction_run = ExtractionRun(
        broker_id=current_broker.id,
        recording_id=recording.id,
        transcript_id=transcript.id,
        provider=settings.extraction_provider,
        model=settings.extraction_model,
        prompt_version=settings.extraction_prompt_version,
        status="completed",
        raw_response_json=json.dumps(raw_response),
    )
    session.add(extraction_run)
    session.commit()
    session.refresh(extraction_run)

    stale_actions = session.exec(
        select(DraftAction).where(
            DraftAction.recording_id == recording.id,
            DraftAction.broker_id == current_broker.id,
            DraftAction.review_status != "approved",
        )
    ).all()
    for stale_action in stale_actions:
        session.delete(stale_action)
    session.commit()

    created_actions: list[DraftAction] = []
    for candidate in candidates:
        draft_action = DraftAction(
            broker_id=current_broker.id,
            extraction_run_id=extraction_run.id,
            recording_id=recording.id,
            transcript_id=transcript.id,
            property_id=candidate.property_id,
            contact_id=candidate.contact_id,
            contact_role=candidate.contact_role,
            action_type=candidate.action_type,
            title=candidate.title,
            description=candidate.description,
            starts_at=candidate.starts_at,
            ends_at=candidate.ends_at,
            due_at=candidate.due_at,
            confidence_label=candidate.confidence_label,
            unresolved_fields_json=json.dumps(candidate.unresolved_fields),
            review_status="pending",
        )
        session.add(draft_action)
        created_actions.append(draft_action)

    recording.processing_status = "extracted"
    recording.updated_at = utcnow()
    session.add(recording)
    session.commit()

    for draft_action in created_actions:
        session.refresh(draft_action)

    return ExtractionResultRead(
        transcript=as_transcript_read(transcript),
        extraction_run=as_extraction_run_read(extraction_run),
        draft_actions=[as_draft_action_read(row) for row in created_actions],
    )


@router.get("/recordings/{recording_id}/draft-actions", response_model=list[DraftActionRead])
def list_recording_draft_actions(
    recording_id: str,
    current_broker: Broker = Depends(get_current_broker),
    session: Session = Depends(get_session),
) -> list[DraftActionRead]:
    owned_or_404(session, AudioRecording, recording_id, current_broker.id)
    rows = session.exec(
        select(DraftAction)
        .where(DraftAction.recording_id == recording_id, DraftAction.broker_id == current_broker.id)
        .order_by(DraftAction.created_at.desc())
    ).all()
    return [as_draft_action_read(row) for row in rows]


@router.post("/draft-actions/{draft_action_id}/approve", response_model=CalendarEventRead)
def approve_draft_action(
    draft_action_id: str,
    current_broker: Broker = Depends(get_current_broker),
    session: Session = Depends(get_session),
) -> CalendarEventRead:
    draft_action = owned_or_404(session, DraftAction, draft_action_id, current_broker.id)
    return as_event_read(create_calendar_event_from_draft_action(session, current_broker, draft_action))


@router.patch("/draft-actions/{draft_action_id}", response_model=DraftActionRead)
def patch_draft_action(
    draft_action_id: str,
    payload: DraftActionUpdate,
    current_broker: Broker = Depends(get_current_broker),
    session: Session = Depends(get_session),
) -> DraftActionRead:
    draft_action = owned_or_404(session, DraftAction, draft_action_id, current_broker.id)
    candidate = payload.model_dump(exclude_unset=True)
    if "property_id" in candidate and candidate["property_id"] is not None:
        owned_or_404(session, Property, candidate["property_id"], current_broker.id)
    if "contact_id" in candidate and candidate["contact_id"] is not None:
        owned_or_404(session, Contact, candidate["contact_id"], current_broker.id)
    unresolved_fields = parse_unresolved_fields(draft_action.unresolved_fields_json)
    if payload.unresolved_fields is not None:
        draft_action.unresolved_fields_json = json.dumps(payload.unresolved_fields)
    else:
        if payload.property_id is not None and "property_id" in unresolved_fields:
            unresolved_fields.remove("property_id")
        if payload.contact_id is not None and "contact_id" in unresolved_fields:
            unresolved_fields.remove("contact_id")
        if (payload.starts_at is not None or payload.due_at is not None) and "timing" in unresolved_fields:
            unresolved_fields.remove("timing")
        draft_action.unresolved_fields_json = json.dumps(unresolved_fields)
    apply_updates(draft_action, payload)
    session.add(draft_action)
    session.commit()
    session.refresh(draft_action)
    return as_draft_action_read(draft_action)


@router.post("/draft-actions/bulk-approve", response_model=list[CalendarEventRead])
def bulk_approve_draft_actions(
    payload: BulkApproveRequest,
    current_broker: Broker = Depends(get_current_broker),
    session: Session = Depends(get_session),
) -> list[CalendarEventRead]:
    events: list[CalendarEventRead] = []
    for draft_action_id in payload.draft_action_ids:
        draft_action = owned_or_404(session, DraftAction, draft_action_id, current_broker.id)
        events.append(as_event_read(create_calendar_event_from_draft_action(session, current_broker, draft_action)))
    return events