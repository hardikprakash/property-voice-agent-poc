from pathlib import Path
from typing import Annotated

from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlmodel import Session, select

from app.core.config import get_settings
from app.core.security import create_access_token, decode_subject, hash_password, verify_password
from app.db import get_session, init_db, settings
from app.models import AudioRecording, Broker, CalendarEvent, Contact, DraftAction, ExtractionRun, Property, PropertyContactLink, Transcript, utcnow
from app.schemas import (
    AuthSession,
    AudioRecordingRead,
    BrokerLogin,
    BrokerRead,
    BrokerRegister,
    CalendarEventCreate,
    CalendarEventRead,
    CalendarEventUpdate,
    ContactCreate,
    ContactRead,
    ContactUpdate,
    PropertyContactLinkCreate,
    PropertyContactLinkRead,
    PropertyContactLinkUpdate,
    PropertyCreate,
    PropertyRead,
    PropertyUpdate,
)

settings = get_settings()
bearer_scheme = HTTPBearer(auto_error=False)

app = FastAPI(title=settings.app_name)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://127.0.0.1:5173", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    init_db()


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


def as_broker_read(broker: Broker) -> BrokerRead:
    return BrokerRead.model_validate(broker, from_attributes=True)


def as_property_read(property_: Property) -> PropertyRead:
    return PropertyRead.model_validate(property_, from_attributes=True)


def as_contact_read(contact: Contact) -> ContactRead:
    return ContactRead.model_validate(contact, from_attributes=True)


def as_property_contact_link_read(link: PropertyContactLink) -> PropertyContactLinkRead:
    return PropertyContactLinkRead.model_validate(link, from_attributes=True)


def as_event_read(event: CalendarEvent) -> CalendarEventRead:
    return CalendarEventRead.model_validate(event, from_attributes=True)


def as_recording_read(recording: AudioRecording) -> AudioRecordingRead:
    return AudioRecordingRead.model_validate(recording, from_attributes=True)


def build_auth_session(broker: Broker) -> AuthSession:
    token = create_access_token(broker.id, settings.secret_key, settings.access_token_expire_minutes)
    return AuthSession(access_token=token, broker=as_broker_read(broker))


def get_current_broker(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    session: Session = Depends(get_session),
) -> Broker:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    broker_id = decode_subject(credentials.credentials, settings.secret_key)
    broker = session.get(Broker, broker_id)
    if broker is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return broker


def owned_or_404(session: Session, model: type, item_id: str, broker_id: str):
    item = session.get(model, item_id)
    if item is None or getattr(item, "broker_id", None) != broker_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    return item


def apply_updates(instance, payload) -> None:
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(instance, key, value)
    instance.updated_at = utcnow()


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


@app.post("/api/auth/register", response_model=AuthSession, status_code=status.HTTP_201_CREATED)
def register(payload: BrokerRegister, session: Session = Depends(get_session)) -> AuthSession:
    existing = session.exec(select(Broker).where(Broker.email == payload.email)).first()
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    broker = Broker(
        email=payload.email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
    )
    session.add(broker)
    session.commit()
    session.refresh(broker)
    return build_auth_session(broker)


@app.post("/api/auth/login", response_model=AuthSession)
def login(payload: BrokerLogin, session: Session = Depends(get_session)) -> AuthSession:
    broker = session.exec(select(Broker).where(Broker.email == payload.email)).first()
    if broker is None or not verify_password(payload.password, broker.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return build_auth_session(broker)


@app.post("/api/auth/logout")
def logout() -> dict[str, str]:
    return {"detail": "Logged out"}


@app.get("/api/auth/me", response_model=BrokerRead)
def me(current_broker: Broker = Depends(get_current_broker)) -> BrokerRead:
    return as_broker_read(current_broker)


@app.get("/api/properties", response_model=list[PropertyRead])
def list_properties(
    current_broker: Broker = Depends(get_current_broker),
    session: Session = Depends(get_session),
) -> list[PropertyRead]:
    rows = session.exec(
        select(Property).where(Property.broker_id == current_broker.id).order_by(Property.created_at.desc())
    ).all()
    return [as_property_read(row) for row in rows]


@app.post("/api/properties", response_model=PropertyRead, status_code=status.HTTP_201_CREATED)
def create_property(
    payload: PropertyCreate,
    current_broker: Broker = Depends(get_current_broker),
    session: Session = Depends(get_session),
) -> PropertyRead:
    property_ = Property(broker_id=current_broker.id, **payload.model_dump())
    session.add(property_)
    session.commit()
    session.refresh(property_)
    return as_property_read(property_)


@app.get("/api/properties/{property_id}", response_model=PropertyRead)
def get_property(
    property_id: str,
    current_broker: Broker = Depends(get_current_broker),
    session: Session = Depends(get_session),
) -> PropertyRead:
    property_ = owned_or_404(session, Property, property_id, current_broker.id)
    return as_property_read(property_)


@app.patch("/api/properties/{property_id}", response_model=PropertyRead)
def update_property(
    property_id: str,
    payload: PropertyUpdate,
    current_broker: Broker = Depends(get_current_broker),
    session: Session = Depends(get_session),
) -> PropertyRead:
    property_ = owned_or_404(session, Property, property_id, current_broker.id)
    apply_updates(property_, payload)
    session.add(property_)
    session.commit()
    session.refresh(property_)
    return as_property_read(property_)


@app.delete("/api/properties/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_property(
    property_id: str,
    current_broker: Broker = Depends(get_current_broker),
    session: Session = Depends(get_session),
) -> None:
    property_ = owned_or_404(session, Property, property_id, current_broker.id)
    session.delete(property_)
    session.commit()


@app.get("/api/contacts", response_model=list[ContactRead])
def list_contacts(
    current_broker: Broker = Depends(get_current_broker),
    session: Session = Depends(get_session),
) -> list[ContactRead]:
    rows = session.exec(
        select(Contact).where(Contact.broker_id == current_broker.id).order_by(Contact.created_at.desc())
    ).all()
    return [as_contact_read(row) for row in rows]


@app.post("/api/contacts", response_model=ContactRead, status_code=status.HTTP_201_CREATED)
def create_contact(
    payload: ContactCreate,
    current_broker: Broker = Depends(get_current_broker),
    session: Session = Depends(get_session),
) -> ContactRead:
    contact = Contact(broker_id=current_broker.id, **payload.model_dump())
    session.add(contact)
    session.commit()
    session.refresh(contact)
    return as_contact_read(contact)


@app.get("/api/contacts/{contact_id}", response_model=ContactRead)
def get_contact(
    contact_id: str,
    current_broker: Broker = Depends(get_current_broker),
    session: Session = Depends(get_session),
) -> ContactRead:
    contact = owned_or_404(session, Contact, contact_id, current_broker.id)
    return as_contact_read(contact)


@app.patch("/api/contacts/{contact_id}", response_model=ContactRead)
def update_contact(
    contact_id: str,
    payload: ContactUpdate,
    current_broker: Broker = Depends(get_current_broker),
    session: Session = Depends(get_session),
) -> ContactRead:
    contact = owned_or_404(session, Contact, contact_id, current_broker.id)
    apply_updates(contact, payload)
    session.add(contact)
    session.commit()
    session.refresh(contact)
    return as_contact_read(contact)


@app.delete("/api/contacts/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contact(
    contact_id: str,
    current_broker: Broker = Depends(get_current_broker),
    session: Session = Depends(get_session),
) -> None:
    contact = owned_or_404(session, Contact, contact_id, current_broker.id)
    session.delete(contact)
    session.commit()


@app.post("/api/property-contact-links", response_model=PropertyContactLinkRead, status_code=status.HTTP_201_CREATED)
def create_property_contact_link(
    payload: PropertyContactLinkCreate,
    current_broker: Broker = Depends(get_current_broker),
    session: Session = Depends(get_session),
) -> PropertyContactLinkRead:
    owned_or_404(session, Property, payload.property_id, current_broker.id)
    owned_or_404(session, Contact, payload.contact_id, current_broker.id)
    link = PropertyContactLink(broker_id=current_broker.id, **payload.model_dump())
    session.add(link)
    session.commit()
    session.refresh(link)
    return as_property_contact_link_read(link)


@app.patch("/api/property-contact-links/{link_id}", response_model=PropertyContactLinkRead)
def update_property_contact_link(
    link_id: str,
    payload: PropertyContactLinkUpdate,
    current_broker: Broker = Depends(get_current_broker),
    session: Session = Depends(get_session),
) -> PropertyContactLinkRead:
    link = owned_or_404(session, PropertyContactLink, link_id, current_broker.id)
    candidate = payload.model_dump(exclude_unset=True)
    if "property_id" in candidate:
        owned_or_404(session, Property, candidate["property_id"], current_broker.id)
    if "contact_id" in candidate:
        owned_or_404(session, Contact, candidate["contact_id"], current_broker.id)
    apply_updates(link, payload)
    session.add(link)
    session.commit()
    session.refresh(link)
    return as_property_contact_link_read(link)


@app.delete("/api/property-contact-links/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_property_contact_link(
    link_id: str,
    current_broker: Broker = Depends(get_current_broker),
    session: Session = Depends(get_session),
) -> None:
    link = owned_or_404(session, PropertyContactLink, link_id, current_broker.id)
    session.delete(link)
    session.commit()


@app.get("/api/events", response_model=list[CalendarEventRead])
def list_events(
    current_broker: Broker = Depends(get_current_broker),
    session: Session = Depends(get_session),
) -> list[CalendarEventRead]:
    rows = session.exec(
        select(CalendarEvent).where(CalendarEvent.broker_id == current_broker.id).order_by(CalendarEvent.created_at.desc())
    ).all()
    return [as_event_read(row) for row in rows]


@app.post("/api/events", response_model=CalendarEventRead, status_code=status.HTTP_201_CREATED)
def create_event(
    payload: CalendarEventCreate,
    current_broker: Broker = Depends(get_current_broker),
    session: Session = Depends(get_session),
) -> CalendarEventRead:
    if payload.starts_at is None and payload.due_at is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Either starts_at or due_at is required")
    if payload.property_id is not None:
        owned_or_404(session, Property, payload.property_id, current_broker.id)
    if payload.contact_id is not None:
        owned_or_404(session, Contact, payload.contact_id, current_broker.id)
    event = CalendarEvent(broker_id=current_broker.id, **payload.model_dump())
    session.add(event)
    session.commit()
    session.refresh(event)
    return as_event_read(event)


@app.get("/api/events/{event_id}", response_model=CalendarEventRead)
def get_event(
    event_id: str,
    current_broker: Broker = Depends(get_current_broker),
    session: Session = Depends(get_session),
) -> CalendarEventRead:
    event = owned_or_404(session, CalendarEvent, event_id, current_broker.id)
    return as_event_read(event)


@app.patch("/api/events/{event_id}", response_model=CalendarEventRead)
def update_event(
    event_id: str,
    payload: CalendarEventUpdate,
    current_broker: Broker = Depends(get_current_broker),
    session: Session = Depends(get_session),
) -> CalendarEventRead:
    event = owned_or_404(session, CalendarEvent, event_id, current_broker.id)
    candidate = payload.model_dump(exclude_unset=True)
    if "property_id" in candidate and candidate["property_id"] is not None:
        owned_or_404(session, Property, candidate["property_id"], current_broker.id)
    if "contact_id" in candidate and candidate["contact_id"] is not None:
        owned_or_404(session, Contact, candidate["contact_id"], current_broker.id)
    apply_updates(event, payload)
    session.add(event)
    session.commit()
    session.refresh(event)
    return as_event_read(event)


@app.delete("/api/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    event_id: str,
    current_broker: Broker = Depends(get_current_broker),
    session: Session = Depends(get_session),
) -> None:
    event = owned_or_404(session, CalendarEvent, event_id, current_broker.id)
    session.delete(event)
    session.commit()


@app.post("/api/recordings/upload", response_model=AudioRecordingRead, status_code=status.HTTP_201_CREATED)
async def upload_recording(
    file: UploadFile = File(...),
    duration_seconds: int | None = Form(default=None),
    current_broker: Broker = Depends(get_current_broker),
    session: Session = Depends(get_session),
) -> AudioRecordingRead:
    recording = await save_uploaded_recording(file, "uploaded_file", current_broker, session, duration_seconds)
    return as_recording_read(recording)


@app.post("/api/recordings/browser", response_model=AudioRecordingRead, status_code=status.HTTP_201_CREATED)
async def browser_recording(
    file: UploadFile = File(...),
    duration_seconds: int | None = Form(default=None),
    current_broker: Broker = Depends(get_current_broker),
    session: Session = Depends(get_session),
) -> AudioRecordingRead:
    recording = await save_uploaded_recording(file, "browser_recording", current_broker, session, duration_seconds)
    return as_recording_read(recording)


@app.get("/api/recordings", response_model=list[AudioRecordingRead])
def list_recordings(
    current_broker: Broker = Depends(get_current_broker),
    session: Session = Depends(get_session),
) -> list[AudioRecordingRead]:
    rows = session.exec(
        select(AudioRecording).where(AudioRecording.broker_id == current_broker.id).order_by(AudioRecording.created_at.desc())
    ).all()
    return [as_recording_read(row) for row in rows]


@app.get("/api/recordings/{recording_id}", response_model=AudioRecordingRead)
def get_recording(
    recording_id: str,
    current_broker: Broker = Depends(get_current_broker),
    session: Session = Depends(get_session),
) -> AudioRecordingRead:
    recording = owned_or_404(session, AudioRecording, recording_id, current_broker.id)
    return as_recording_read(recording)


@app.post("/api/recordings/{recording_id}/transcribe")
def transcribe_recording(
    recording_id: str,
    current_broker: Broker = Depends(get_current_broker),
    session: Session = Depends(get_session),
) -> dict[str, str]:
    owned_or_404(session, AudioRecording, recording_id, current_broker.id)
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Transcription pipeline is not wired yet")


@app.post("/api/recordings/{recording_id}/extract-actions")
def extract_actions(
    recording_id: str,
    current_broker: Broker = Depends(get_current_broker),
    session: Session = Depends(get_session),
) -> dict[str, str]:
    owned_or_404(session, AudioRecording, recording_id, current_broker.id)
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Extraction pipeline is not wired yet")


@app.get("/api/recordings/{recording_id}/draft-actions")
def list_recording_draft_actions(
    recording_id: str,
    current_broker: Broker = Depends(get_current_broker),
    session: Session = Depends(get_session),
) -> list[dict[str, str]]:
    owned_or_404(session, AudioRecording, recording_id, current_broker.id)
    return []


@app.post("/api/draft-actions/{draft_action_id}/approve")
def approve_draft_action(
    draft_action_id: str,
    current_broker: Broker = Depends(get_current_broker),
    session: Session = Depends(get_session),
) -> dict[str, str]:
    owned_or_404(session, DraftAction, draft_action_id, current_broker.id)
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Draft action approval is not wired yet")


@app.patch("/api/draft-actions/{draft_action_id}")
def patch_draft_action(
    draft_action_id: str,
    current_broker: Broker = Depends(get_current_broker),
    session: Session = Depends(get_session),
) -> dict[str, str]:
    owned_or_404(session, DraftAction, draft_action_id, current_broker.id)
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Draft action editing is not wired yet")


@app.post("/api/draft-actions/bulk-approve")
def bulk_approve_draft_actions(
    current_broker: Broker = Depends(get_current_broker),
    session: Session = Depends(get_session),
) -> dict[str, str]:
    _ = current_broker, session
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Bulk approval is not wired yet")
