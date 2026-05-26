from __future__ import annotations

import json

import httpx

from app.core.config import Settings
from app.models import AudioRecording, Contact, Property, PropertyContactLink
from app.services.voice import generate_draft_candidates, generate_transcript_text


def test_openai_transcription_provider_reads_audio_file(tmp_path) -> None:
    audio_path = tmp_path / "call.wav"
    audio_path.write_bytes(b"audio-bytes")
    recording = AudioRecording(
        broker_id="broker-1",
        original_filename="call.wav",
        storage_path=str(audio_path),
        mime_type="audio/wav",
        file_size_bytes=audio_path.stat().st_size,
        capture_source="uploaded_file",
    )
    settings = Settings(
        transcription_provider="openai",
        transcription_model="gpt-4o-mini-transcribe",
        transcription_api_key="test-key",
        transcription_base_url="https://transcribe.example.test/v1",
        data_dir=tmp_path,
    )

    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path.endswith("/audio/transcriptions")
        assert request.headers["Authorization"] == "Bearer test-key"
        return httpx.Response(200, json={"text": "Call transcript from provider"})

    transcript_text = generate_transcript_text(recording, settings, transport=httpx.MockTransport(handler))

    assert transcript_text == "Call transcript from provider"


def test_openrouter_extraction_provider_maps_ids_from_context(tmp_path) -> None:
    property_ = Property(
        id="property-1",
        broker_id="broker-1",
        title="Harbor House",
        address_line_1="12 Bay Street",
        city="Mumbai",
        state="MH",
        postal_code="400001",
        property_type="flat",
    )
    contact = Contact(
        id="contact-1",
        broker_id="broker-1",
        full_name="Maya Alvarez",
    )
    link = PropertyContactLink(
        broker_id="broker-1",
        property_id=property_.id,
        contact_id=contact.id,
        role="buyer",
    )
    settings = Settings(
        extraction_provider="openrouter",
        extraction_model="openai/gpt-4.1-mini",
        extraction_api_key="test-key",
        extraction_base_url="https://openrouter.example.test/api/v1",
        openrouter_app_name="Property Voice Agent PoC",
        data_dir=tmp_path,
    )

    provider_payload = {
        "summary": "Buyer asked for a visit.",
        "actions": [
            {
                "action_type": "property_visit",
                "title": "Property visit with Maya Alvarez",
                "description": "Buyer Maya Alvarez wants to visit Harbor House on 2026-06-01 at 15:30.",
                "property_id": property_.id,
                "contact_id": contact.id,
                "contact_role": "buyer",
                "starts_at": "2026-06-01T15:30:00Z",
                "ends_at": "2026-06-01T16:30:00Z",
                "due_at": None,
                "confidence_label": "high",
                "unresolved_fields": [],
                "source_line": "Buyer Maya Alvarez wants to visit Harbor House on 2026-06-01 at 15:30.",
            }
        ],
    }

    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path.endswith("/chat/completions")
        assert request.headers["Authorization"] == "Bearer test-key"
        body = json.loads(request.content.decode())
        assert body["model"] == "openai/gpt-4.1-mini"
        assert body["response_format"]["json_schema"]["schema"]["required"] == ["summary", "actions"]
        return httpx.Response(
            200,
            json={
                "choices": [
                    {
                        "message": {
                            "content": json.dumps(provider_payload),
                        }
                    }
                ]
            },
        )

    candidates, raw_response = generate_draft_candidates(
        "Buyer Maya Alvarez wants to visit Harbor House on 2026-06-01 at 15:30.",
        [property_],
        [contact],
        [link],
        settings,
        transport=httpx.MockTransport(handler),
    )

    assert len(candidates) == 1
    assert candidates[0].property_id == property_.id
    assert candidates[0].contact_id == contact.id
    assert candidates[0].contact_role == "buyer"
    assert candidates[0].starts_at is not None
    assert candidates[0].starts_at.isoformat() == "2026-06-01T15:30:00+00:00"
    assert raw_response["choices"][0]["message"]["content"] == json.dumps(provider_payload)