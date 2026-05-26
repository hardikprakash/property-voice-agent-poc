from app.core.config import get_settings
from app.core.security import create_access_token
from app.models import AudioRecording, Broker, CalendarEvent, Contact, DraftAction, ExtractionRun, Property, PropertyContactLink, Transcript
from app.schemas import (
    AuthSession,
    AudioRecordingRead,
    BrokerRead,
    CalendarEventRead,
    ContactRead,
    DraftActionRead,
    ExtractionRunRead,
    PropertyContactLinkRead,
    PropertyRead,
    TranscriptRead,
)

from app.api.utils import parse_unresolved_fields


settings = get_settings()


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


def as_transcript_read(transcript: Transcript) -> TranscriptRead:
    return TranscriptRead.model_validate(transcript, from_attributes=True)


def as_extraction_run_read(extraction_run: ExtractionRun) -> ExtractionRunRead:
    return ExtractionRunRead.model_validate(extraction_run, from_attributes=True)


def as_draft_action_read(draft_action: DraftAction) -> DraftActionRead:
    payload = DraftActionRead.model_validate(draft_action, from_attributes=True)
    payload.unresolved_fields = parse_unresolved_fields(draft_action.unresolved_fields_json)
    return payload


def build_auth_session(broker: Broker) -> AuthSession:
    token = create_access_token(broker.id, settings.secret_key, settings.access_token_expire_minutes)
    return AuthSession(access_token=token, broker=as_broker_read(broker))