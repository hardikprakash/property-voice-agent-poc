from __future__ import annotations

import json
import shutil
from datetime import UTC, datetime, timedelta
from pathlib import Path

from sqlmodel import Session, select

from app.core.config import get_settings
from app.core.security import hash_password
from app.db import engine, init_db
from app.models import AudioRecording, Broker, CalendarEvent, Contact, DraftAction, ExtractionRun, Property, PropertyContactLink, Transcript


DEMO_EMAIL = "demo@propertyvoice.example.com"
LEGACY_DEMO_EMAIL = "demo@propertyvoice.local"
DEMO_PASSWORD = "demo12345"
DEMO_FULL_NAME = "Demo Broker"


def _demo_now() -> datetime:
    return datetime.now(UTC).replace(second=0, microsecond=0)


def _reset_demo_broker(session: Session, broker: Broker) -> None:
    for model in (CalendarEvent, DraftAction, ExtractionRun, Transcript, AudioRecording, PropertyContactLink, Contact, Property):
        rows = session.exec(select(model).where(model.broker_id == broker.id)).all()
        for row in rows:
            session.delete(row)
    session.commit()

    recording_dir = get_settings().recording_dir / broker.id
    if recording_dir.exists():
        shutil.rmtree(recording_dir)


def _ensure_demo_broker(session: Session) -> Broker:
    broker = session.exec(select(Broker).where(Broker.email == DEMO_EMAIL)).first()
    if broker is None:
        broker = session.exec(select(Broker).where(Broker.email == LEGACY_DEMO_EMAIL)).first()
    if broker is None:
        broker = Broker(email=DEMO_EMAIL, password_hash=hash_password(DEMO_PASSWORD), full_name=DEMO_FULL_NAME)
        session.add(broker)
        session.commit()
        session.refresh(broker)
    else:
        broker.email = DEMO_EMAIL
        broker.password_hash = hash_password(DEMO_PASSWORD)
        broker.full_name = DEMO_FULL_NAME
        session.add(broker)
        session.commit()
        session.refresh(broker)

    _reset_demo_broker(session, broker)
    return broker


def _write_placeholder_recording_file(broker_id: str, filename: str, contents: bytes) -> str:
    settings = get_settings()
    directory = settings.recording_dir / broker_id
    directory.mkdir(parents=True, exist_ok=True)
    path = directory / filename
    path.write_bytes(contents)
    return str(path)


def seed_demo_data() -> dict[str, int | str]:
    init_db()
    now = _demo_now()
    settings = get_settings()

    with Session(engine) as session:
        broker = _ensure_demo_broker(session)

        properties = {
            "harbor": Property(
                broker_id=broker.id,
                title="Harbor House",
                address_line_1="12 Bay Street",
                address_line_2="Sea Wing, Floor 8",
                city="Mumbai",
                state="MH",
                postal_code="400001",
                property_type="flat",
                notes="Sea-facing 3BHK. Buyers keep asking about parking and society transfer timelines.",
                is_active=True,
            ),
            "palm": Property(
                broker_id=broker.id,
                title="Palm Residency",
                address_line_1="44 Lake View Road",
                address_line_2=None,
                city="Bengaluru",
                state="KA",
                postal_code="560001",
                property_type="villa",
                notes="Family villa with garden. Strong interest from relocation buyers.",
                is_active=True,
            ),
            "cedar": Property(
                broker_id=broker.id,
                title="Cedar Court Offices",
                address_line_1="8 Residency Plaza",
                address_line_2="Unit 203",
                city="Pune",
                state="MH",
                postal_code="411001",
                property_type="commercial",
                notes="Office floor split across two wings. Follow-ups usually involve document review.",
                is_active=True,
            ),
            "maple": Property(
                broker_id=broker.id,
                title="Maple Square",
                address_line_1="19 Green Avenue",
                address_line_2=None,
                city="Delhi",
                state="DL",
                postal_code="110001",
                property_type="flat",
                notes="Paused listing kept for historical context and prior call transcripts.",
                is_active=False,
            ),
        }
        for property_ in properties.values():
            session.add(property_)
        session.commit()
        for property_ in properties.values():
            session.refresh(property_)

        contacts = {
            "maya": Contact(
                broker_id=broker.id,
                full_name="Maya Alvarez",
                phone_number="9999999999",
                email="maya@example.com",
                notes="Buyer wants quick scheduling options after work hours.",
            ),
            "ben": Contact(
                broker_id=broker.id,
                full_name="Ben Foster",
                phone_number="8888888888",
                email="ben@example.com",
                notes="Seller needs document reminders one day in advance.",
            ),
            "asha": Contact(
                broker_id=broker.id,
                full_name="Asha Mehta",
                phone_number="7777777777",
                email="asha@example.com",
                notes="Buyer comparing Palm Residency with two nearby villas.",
            ),
            "arjun": Contact(
                broker_id=broker.id,
                full_name="Arjun Rao",
                phone_number="6666666666",
                email="arjun@example.com",
                notes="Seller prefers WhatsApp follow-ups after 6 PM.",
            ),
            "neha": Contact(
                broker_id=broker.id,
                full_name="Neha Kapoor",
                phone_number="5555555555",
                email="neha@example.com",
                notes="Buyer interested in office spaces with faster possession windows.",
            ),
            "legal": Contact(
                broker_id=broker.id,
                full_name="Legal Desk",
                phone_number="4444444444",
                email="legal@example.com",
                notes="Supports document scrutiny before final site visits.",
            ),
        }
        for contact in contacts.values():
            session.add(contact)
        session.commit()
        for contact in contacts.values():
            session.refresh(contact)

        links = [
            PropertyContactLink(broker_id=broker.id, property_id=properties["harbor"].id, contact_id=contacts["maya"].id, role="buyer", notes="Primary buyer lead."),
            PropertyContactLink(broker_id=broker.id, property_id=properties["harbor"].id, contact_id=contacts["ben"].id, role="seller", notes="Current owner contact."),
            PropertyContactLink(broker_id=broker.id, property_id=properties["palm"].id, contact_id=contacts["asha"].id, role="buyer", notes="Warm buyer from relocation funnel."),
            PropertyContactLink(broker_id=broker.id, property_id=properties["palm"].id, contact_id=contacts["arjun"].id, role="seller", notes="Seller asks for weekly summary."),
            PropertyContactLink(broker_id=broker.id, property_id=properties["cedar"].id, contact_id=contacts["neha"].id, role="buyer", notes="Commercial buyer evaluating fit-out budget."),
            PropertyContactLink(broker_id=broker.id, property_id=properties["cedar"].id, contact_id=contacts["legal"].id, role="other", notes="Document support contact."),
        ]
        for link in links:
            session.add(link)
        session.commit()

        harbor_recording = AudioRecording(
            broker_id=broker.id,
            original_filename="harbor-house-buyer-call.webm",
            storage_path="",
            mime_type="audio/webm",
            file_size_bytes=2048,
            duration_seconds=186,
            capture_source="browser_recording",
            processing_status="extracted",
        )
        harbor_recording.storage_path = _write_placeholder_recording_file(
            broker.id,
            f"{harbor_recording.id}_harbor-house-buyer-call.webm",
            b"demo audio placeholder for harbor house buyer call",
        )

        documents_recording = AudioRecording(
            broker_id=broker.id,
            original_filename="seller-documents-call.wav",
            storage_path="",
            mime_type="audio/wav",
            file_size_bytes=3072,
            duration_seconds=142,
            capture_source="uploaded_file",
            processing_status="extracted",
        )
        documents_recording.storage_path = _write_placeholder_recording_file(
            broker.id,
            f"{documents_recording.id}_seller-documents-call.wav",
            b"demo audio placeholder for seller document call",
        )

        quick_note_recording = AudioRecording(
            broker_id=broker.id,
            original_filename="Palm Residency quick note",
            storage_path="",
            mime_type="text/plain",
            file_size_bytes=164,
            duration_seconds=None,
            capture_source="text_note",
            processing_status="extracted",
        )

        uploaded_waiting_recording = AudioRecording(
            broker_id=broker.id,
            original_filename="legacy-voicemail.mp3",
            storage_path="",
            mime_type="audio/mpeg",
            file_size_bytes=1024,
            duration_seconds=58,
            capture_source="uploaded_file",
            processing_status="uploaded",
        )
        uploaded_waiting_recording.storage_path = _write_placeholder_recording_file(
            broker.id,
            f"{uploaded_waiting_recording.id}_legacy-voicemail.mp3",
            b"demo audio placeholder for unprocessed voicemail",
        )

        transcribed_only_recording = AudioRecording(
            broker_id=broker.id,
            original_filename="cedar-court-call.webm",
            storage_path="",
            mime_type="audio/webm",
            file_size_bytes=1536,
            duration_seconds=96,
            capture_source="browser_recording",
            processing_status="transcribed",
        )
        transcribed_only_recording.storage_path = _write_placeholder_recording_file(
            broker.id,
            f"{transcribed_only_recording.id}_cedar-court-call.webm",
            b"demo audio placeholder for cedar court call",
        )

        recordings = [harbor_recording, documents_recording, quick_note_recording, uploaded_waiting_recording, transcribed_only_recording]
        for recording in recordings:
            session.add(recording)
        session.commit()
        for recording in recordings:
            session.refresh(recording)

        transcripts = {
            "harbor": Transcript(
                broker_id=broker.id,
                recording_id=harbor_recording.id,
                provider=settings.transcription_provider,
                raw_text="Maya Alvarez wants to visit Harbor House tomorrow at 6:30 PM. After the visit, follow up in two days about parking allocation and society documents.",
                language_code="en",
            ),
            "documents": Transcript(
                broker_id=broker.id,
                recording_id=documents_recording.id,
                provider=settings.transcription_provider,
                raw_text="Seller Ben Foster asked for a checklist of pending documents for Harbor House. Call tomorrow morning to confirm the share certificate and society NOC timeline.",
                language_code="en",
            ),
            "note": Transcript(
                broker_id=broker.id,
                recording_id=quick_note_recording.id,
                provider="manual_note",
                raw_text="Asha Mehta wants to revisit Palm Residency on Saturday afternoon if financing options are ready. Follow up by Friday evening.",
                language_code="en",
            ),
            "cedar": Transcript(
                broker_id=broker.id,
                recording_id=transcribed_only_recording.id,
                provider=settings.transcription_provider,
                raw_text="Neha Kapoor asked whether Cedar Court Offices can be split floor-wise. Need to summarize fit-out cost estimates before extracting actions.",
                language_code="en",
            ),
        }
        for transcript in transcripts.values():
            session.add(transcript)
        session.commit()
        for transcript in transcripts.values():
            session.refresh(transcript)

        extraction_runs = {
            "harbor": ExtractionRun(
                broker_id=broker.id,
                recording_id=harbor_recording.id,
                transcript_id=transcripts["harbor"].id,
                provider=settings.extraction_provider,
                model=settings.extraction_model,
                prompt_version=settings.extraction_prompt_version,
                status="completed",
                raw_response_json=json.dumps({"source": "demo", "summary": "Visit plus follow-up for Harbor House buyer call."}),
            ),
            "documents": ExtractionRun(
                broker_id=broker.id,
                recording_id=documents_recording.id,
                transcript_id=transcripts["documents"].id,
                provider=settings.extraction_provider,
                model=settings.extraction_model,
                prompt_version=settings.extraction_prompt_version,
                status="completed",
                raw_response_json=json.dumps({"source": "demo", "summary": "Document reminders for Harbor House seller."}),
            ),
            "note": ExtractionRun(
                broker_id=broker.id,
                recording_id=quick_note_recording.id,
                transcript_id=transcripts["note"].id,
                provider=settings.extraction_provider,
                model=settings.extraction_model,
                prompt_version=settings.extraction_prompt_version,
                status="completed",
                raw_response_json=json.dumps({"source": "demo", "summary": "Palm Residency quick note follow-up."}),
            ),
        }
        for extraction_run in extraction_runs.values():
            session.add(extraction_run)
        session.commit()
        for extraction_run in extraction_runs.values():
            session.refresh(extraction_run)

        draft_actions = [
            DraftAction(
                broker_id=broker.id,
                extraction_run_id=extraction_runs["harbor"].id,
                recording_id=harbor_recording.id,
                transcript_id=transcripts["harbor"].id,
                property_id=properties["harbor"].id,
                contact_id=contacts["maya"].id,
                contact_role="buyer",
                action_type="property_visit",
                title="Show Harbor House to Maya",
                description="Evening visit requested after work hours. Carry parking and society transfer details.",
                starts_at=now + timedelta(days=1, hours=2),
                ends_at=now + timedelta(days=1, hours=3),
                due_at=None,
                confidence_label="high",
                unresolved_fields_json=json.dumps([]),
                review_status="approved",
            ),
            DraftAction(
                broker_id=broker.id,
                extraction_run_id=extraction_runs["harbor"].id,
                recording_id=harbor_recording.id,
                transcript_id=transcripts["harbor"].id,
                property_id=properties["harbor"].id,
                contact_id=contacts["maya"].id,
                contact_role="buyer",
                action_type="follow_up",
                title="Check in with Maya after the visit",
                description="Ask whether parking and handover timelines work for her family.",
                starts_at=None,
                ends_at=None,
                due_at=now - timedelta(days=1),
                confidence_label="high",
                unresolved_fields_json=json.dumps([]),
                review_status="approved",
            ),
            DraftAction(
                broker_id=broker.id,
                extraction_run_id=extraction_runs["documents"].id,
                recording_id=documents_recording.id,
                transcript_id=transcripts["documents"].id,
                property_id=properties["harbor"].id,
                contact_id=contacts["ben"].id,
                contact_role="seller",
                action_type="document_check",
                title="Confirm Harbor House document packet with Ben",
                description="Share checklist and confirm share certificate plus society NOC timing.",
                starts_at=None,
                ends_at=None,
                due_at=now + timedelta(hours=18),
                confidence_label="medium",
                unresolved_fields_json=json.dumps([]),
                review_status="pending",
            ),
            DraftAction(
                broker_id=broker.id,
                extraction_run_id=extraction_runs["documents"].id,
                recording_id=documents_recording.id,
                transcript_id=transcripts["documents"].id,
                property_id=None,
                contact_id=contacts["legal"].id,
                contact_role="other",
                action_type="follow_up",
                title="Loop in legal desk on pending title docs",
                description="Unclear if the packet belongs to Harbor House or Cedar Court. Broker should confirm before approval.",
                starts_at=None,
                ends_at=None,
                due_at=now + timedelta(days=2),
                confidence_label="low",
                unresolved_fields_json=json.dumps(["property_id"]),
                review_status="discarded",
            ),
            DraftAction(
                broker_id=broker.id,
                extraction_run_id=extraction_runs["note"].id,
                recording_id=quick_note_recording.id,
                transcript_id=transcripts["note"].id,
                property_id=properties["palm"].id,
                contact_id=contacts["asha"].id,
                contact_role="buyer",
                action_type="follow_up",
                title="Confirm Saturday revisit with Asha",
                description="Check financing prep before locking the revisit slot.",
                starts_at=None,
                ends_at=None,
                due_at=now + timedelta(days=1, hours=4),
                confidence_label="high",
                unresolved_fields_json=json.dumps([]),
                review_status="pending",
            ),
        ]
        for draft_action in draft_actions:
            session.add(draft_action)
        session.commit()
        for draft_action in draft_actions:
            session.refresh(draft_action)

        events = [
            CalendarEvent(
                broker_id=broker.id,
                property_id=properties["harbor"].id,
                contact_id=contacts["maya"].id,
                title="Show Harbor House to Maya",
                description="Evening visit with parking and society handover discussion.",
                event_type="property_visit",
                status="scheduled",
                starts_at=now + timedelta(days=1, hours=2),
                ends_at=now + timedelta(days=1, hours=3),
                due_at=None,
                source="ai_draft",
                source_recording_id=harbor_recording.id,
                source_draft_action_id=draft_actions[0].id,
            ),
            CalendarEvent(
                broker_id=broker.id,
                property_id=properties["harbor"].id,
                contact_id=contacts["maya"].id,
                title="Check in with Maya after the visit",
                description="Discuss parking allocation and whether the family wants a second showing.",
                event_type="follow_up",
                status="done",
                starts_at=None,
                ends_at=None,
                due_at=now - timedelta(days=1),
                source="ai_draft",
                source_recording_id=harbor_recording.id,
                source_draft_action_id=draft_actions[1].id,
            ),
            CalendarEvent(
                broker_id=broker.id,
                property_id=properties["cedar"].id,
                contact_id=contacts["neha"].id,
                title="Prepare Cedar Court fit-out summary",
                description="Manual follow-up before sending a formal office shortlist.",
                event_type="follow_up",
                status="pending",
                starts_at=None,
                ends_at=None,
                due_at=now + timedelta(days=3),
                source="manual",
                source_recording_id=None,
                source_draft_action_id=None,
            ),
            CalendarEvent(
                broker_id=broker.id,
                property_id=properties["palm"].id,
                contact_id=contacts["arjun"].id,
                title="Share Palm Residency paperwork recap",
                description="Manual event already completed after last seller check-in.",
                event_type="document_check",
                status="done",
                starts_at=None,
                ends_at=None,
                due_at=now - timedelta(days=2),
                source="manual",
                source_recording_id=None,
                source_draft_action_id=None,
            ),
        ]
        for event in events:
            session.add(event)
        session.commit()

        return {
            "broker_email": DEMO_EMAIL,
            "broker_password": DEMO_PASSWORD,
            "properties": len(properties),
            "contacts": len(contacts),
            "links": len(links),
            "recordings": len(recordings),
            "transcripts": len(transcripts),
            "extraction_runs": len(extraction_runs),
            "draft_actions": len(draft_actions),
            "events": len(events),
        }


def main() -> None:
    summary = seed_demo_data()
    print("Demo data seeded")
    print(f"Login: {summary['broker_email']}")
    print(f"Password: {summary['broker_password']}")
    print(
        "Counts: "
        f"properties={summary['properties']}, contacts={summary['contacts']}, links={summary['links']}, "
        f"recordings={summary['recordings']}, transcripts={summary['transcripts']}, "
        f"extraction_runs={summary['extraction_runs']}, draft_actions={summary['draft_actions']}, events={summary['events']}"
    )


if __name__ == "__main__":
    main()