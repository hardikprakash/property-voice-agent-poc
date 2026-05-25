from datetime import UTC, datetime
from typing import Optional
from uuid import uuid4

from sqlmodel import Field, SQLModel


def utcnow() -> datetime:
    return datetime.now(UTC)


def new_id() -> str:
    return str(uuid4())


class Broker(SQLModel, table=True):
    id: str = Field(default_factory=new_id, primary_key=True)
    email: str = Field(index=True, unique=True)
    password_hash: str
    full_name: str
    created_at: datetime = Field(default_factory=utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=utcnow, nullable=False)


class Property(SQLModel, table=True):
    id: str = Field(default_factory=new_id, primary_key=True)
    broker_id: str = Field(index=True, foreign_key="broker.id")
    title: str
    address_line_1: str
    address_line_2: Optional[str] = None
    city: str
    state: str
    postal_code: str
    property_type: str
    notes: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=utcnow, nullable=False)


class Contact(SQLModel, table=True):
    id: str = Field(default_factory=new_id, primary_key=True)
    broker_id: str = Field(index=True, foreign_key="broker.id")
    full_name: str
    phone_number: Optional[str] = None
    email: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=utcnow, nullable=False)


class PropertyContactLink(SQLModel, table=True):
    id: str = Field(default_factory=new_id, primary_key=True)
    broker_id: str = Field(index=True, foreign_key="broker.id")
    property_id: str = Field(index=True, foreign_key="property.id")
    contact_id: str = Field(index=True, foreign_key="contact.id")
    role: str
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=utcnow, nullable=False)


class CalendarEvent(SQLModel, table=True):
    id: str = Field(default_factory=new_id, primary_key=True)
    broker_id: str = Field(index=True, foreign_key="broker.id")
    property_id: Optional[str] = Field(default=None, index=True, foreign_key="property.id")
    contact_id: Optional[str] = Field(default=None, index=True, foreign_key="contact.id")
    title: str
    description: Optional[str] = None
    event_type: str
    status: str
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    due_at: Optional[datetime] = None
    source: str = "manual"
    source_recording_id: Optional[str] = Field(default=None, index=True, foreign_key="audiorecording.id")
    source_draft_action_id: Optional[str] = Field(default=None, index=True, foreign_key="draftaction.id")
    created_at: datetime = Field(default_factory=utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=utcnow, nullable=False)


class AudioRecording(SQLModel, table=True):
    id: str = Field(default_factory=new_id, primary_key=True)
    broker_id: str = Field(index=True, foreign_key="broker.id")
    original_filename: str
    storage_path: str
    mime_type: str
    file_size_bytes: int
    duration_seconds: Optional[int] = None
    capture_source: str
    processing_status: str = "uploaded"
    created_at: datetime = Field(default_factory=utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=utcnow, nullable=False)


class Transcript(SQLModel, table=True):
    id: str = Field(default_factory=new_id, primary_key=True)
    broker_id: str = Field(index=True, foreign_key="broker.id")
    recording_id: str = Field(index=True, foreign_key="audiorecording.id")
    provider: str
    raw_text: str
    language_code: str
    created_at: datetime = Field(default_factory=utcnow, nullable=False)


class ExtractionRun(SQLModel, table=True):
    id: str = Field(default_factory=new_id, primary_key=True)
    broker_id: str = Field(index=True, foreign_key="broker.id")
    recording_id: str = Field(index=True, foreign_key="audiorecording.id")
    transcript_id: str = Field(index=True, foreign_key="transcript.id")
    provider: str
    model: str
    prompt_version: str
    status: str
    raw_response_json: Optional[str] = None
    created_at: datetime = Field(default_factory=utcnow, nullable=False)


class DraftAction(SQLModel, table=True):
    id: str = Field(default_factory=new_id, primary_key=True)
    broker_id: str = Field(index=True, foreign_key="broker.id")
    extraction_run_id: str = Field(index=True, foreign_key="extractionrun.id")
    recording_id: str = Field(index=True, foreign_key="audiorecording.id")
    transcript_id: str = Field(index=True, foreign_key="transcript.id")
    property_id: Optional[str] = Field(default=None, index=True, foreign_key="property.id")
    contact_id: Optional[str] = Field(default=None, index=True, foreign_key="contact.id")
    contact_role: Optional[str] = None
    action_type: str
    title: str
    description: Optional[str] = None
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    due_at: Optional[datetime] = None
    confidence_label: str
    unresolved_fields_json: Optional[str] = None
    review_status: str = "pending"
    created_at: datetime = Field(default_factory=utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=utcnow, nullable=False)
