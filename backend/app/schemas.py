from datetime import datetime
from typing import Optional

from pydantic import EmailStr
from sqlmodel import SQLModel


class BrokerRegister(SQLModel):
    email: EmailStr
    password: str
    full_name: str


class BrokerLogin(SQLModel):
    email: EmailStr
    password: str


class BrokerRead(SQLModel):
    id: str
    email: EmailStr
    full_name: str
    created_at: datetime
    updated_at: datetime


class AuthSession(SQLModel):
    access_token: str
    token_type: str = "bearer"
    broker: BrokerRead


class PropertyBase(SQLModel):
    title: str
    address_line_1: str
    address_line_2: Optional[str] = None
    city: str
    state: str
    postal_code: str
    property_type: str
    notes: Optional[str] = None
    is_active: bool = True


class PropertyCreate(PropertyBase):
    pass


class PropertyUpdate(SQLModel):
    title: Optional[str] = None
    address_line_1: Optional[str] = None
    address_line_2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    property_type: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class PropertyRead(PropertyBase):
    id: str
    broker_id: str
    created_at: datetime
    updated_at: datetime


class ContactBase(SQLModel):
    full_name: str
    phone_number: Optional[str] = None
    email: Optional[str] = None
    notes: Optional[str] = None


class ContactCreate(ContactBase):
    pass


class ContactUpdate(SQLModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None
    notes: Optional[str] = None


class ContactRead(ContactBase):
    id: str
    broker_id: str
    created_at: datetime
    updated_at: datetime


class PropertyContactLinkBase(SQLModel):
    property_id: str
    contact_id: str
    role: str
    notes: Optional[str] = None


class PropertyContactLinkCreate(PropertyContactLinkBase):
    pass


class PropertyContactLinkUpdate(SQLModel):
    property_id: Optional[str] = None
    contact_id: Optional[str] = None
    role: Optional[str] = None
    notes: Optional[str] = None


class PropertyContactLinkRead(PropertyContactLinkBase):
    id: str
    broker_id: str
    created_at: datetime
    updated_at: datetime


class CalendarEventBase(SQLModel):
    property_id: Optional[str] = None
    contact_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    event_type: str
    status: str
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    due_at: Optional[datetime] = None
    source: str = "manual"
    source_recording_id: Optional[str] = None
    source_draft_action_id: Optional[str] = None


class CalendarEventCreate(CalendarEventBase):
    pass


class CalendarEventUpdate(SQLModel):
    property_id: Optional[str] = None
    contact_id: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    event_type: Optional[str] = None
    status: Optional[str] = None
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    due_at: Optional[datetime] = None
    source: Optional[str] = None
    source_recording_id: Optional[str] = None
    source_draft_action_id: Optional[str] = None


class CalendarEventRead(CalendarEventBase):
    id: str
    broker_id: str
    created_at: datetime
    updated_at: datetime


class AudioRecordingRead(SQLModel):
    id: str
    broker_id: str
    original_filename: str
    storage_path: str
    mime_type: str
    file_size_bytes: int
    duration_seconds: Optional[int] = None
    capture_source: str
    processing_status: str
    created_at: datetime
    updated_at: datetime


class TranscriptRead(SQLModel):
    id: str
    broker_id: str
    recording_id: str
    provider: str
    raw_text: str
    language_code: str
    created_at: datetime


class TranscriptUpdate(SQLModel):
    raw_text: str
    language_code: Optional[str] = None


class ExtractionRunRead(SQLModel):
    id: str
    broker_id: str
    recording_id: str
    transcript_id: str
    provider: str
    model: str
    prompt_version: str
    status: str
    raw_response_json: Optional[str] = None
    created_at: datetime


class DraftActionBase(SQLModel):
    property_id: Optional[str] = None
    contact_id: Optional[str] = None
    contact_role: Optional[str] = None
    action_type: str
    title: str
    description: Optional[str] = None
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    due_at: Optional[datetime] = None
    confidence_label: str
    unresolved_fields: list[str] = []
    review_status: str


class DraftActionRead(DraftActionBase):
    id: str
    broker_id: str
    extraction_run_id: str
    recording_id: str
    transcript_id: str
    created_at: datetime
    updated_at: datetime


class DraftActionUpdate(SQLModel):
    property_id: Optional[str] = None
    contact_id: Optional[str] = None
    contact_role: Optional[str] = None
    action_type: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    due_at: Optional[datetime] = None
    confidence_label: Optional[str] = None
    unresolved_fields: Optional[list[str]] = None
    review_status: Optional[str] = None


class BulkApproveRequest(SQLModel):
    draft_action_ids: list[str]


class ExtractionResultRead(SQLModel):
    transcript: TranscriptRead
    extraction_run: ExtractionRunRead
    draft_actions: list[DraftActionRead]
