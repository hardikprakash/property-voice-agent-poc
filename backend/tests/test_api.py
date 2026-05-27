from __future__ import annotations

import importlib

import pytest
from fastapi.testclient import TestClient


@pytest.fixture()
def client(tmp_path, monkeypatch) -> TestClient:
    monkeypatch.setenv("DATA_DIR", str(tmp_path / "data"))
    monkeypatch.setenv("SQLITE_FILENAME", "test.db")
    monkeypatch.setenv("SECRET_KEY", "test-secret")
    monkeypatch.setenv("TRANSCRIPTION_PROVIDER", "stub")
    monkeypatch.setenv("EXTRACTION_PROVIDER", "stub")

    from app.core import config as config_module

    config_module.get_settings.cache_clear()

    import app.db as db_module
    import app.main as main_module

    importlib.reload(db_module)
    main_module = importlib.reload(main_module)

    with TestClient(main_module.app) as test_client:
        yield test_client


def register(client: TestClient, email: str = "broker@example.com") -> dict[str, str]:
    response = client.post(
        "/api/auth/register",
        json={"full_name": "Broker One", "email": email, "password": "secret123"},
    )
    assert response.status_code == 201
    body = response.json()
    return {"Authorization": f"Bearer {body['access_token']}"}


def test_voice_pipeline_creates_draft_actions_and_events(client: TestClient) -> None:
    headers = register(client)

    property_response = client.post(
        "/api/properties",
        headers=headers,
        json={
            "title": "Harbor House",
            "address_line_1": "12 Bay Street",
            "city": "Mumbai",
            "state": "MH",
            "postal_code": "400001",
            "property_type": "flat",
            "notes": "Sea-facing",
            "is_active": True,
        },
    )
    assert property_response.status_code == 201
    property_id = property_response.json()["id"]

    buyer_response = client.post(
        "/api/contacts",
        headers=headers,
        json={"full_name": "Maya Alvarez", "phone_number": "9999999999", "email": "maya@example.com"},
    )
    assert buyer_response.status_code == 201
    buyer_id = buyer_response.json()["id"]

    seller_response = client.post(
        "/api/contacts",
        headers=headers,
        json={"full_name": "Ben Foster", "phone_number": "8888888888", "email": "ben@example.com"},
    )
    assert seller_response.status_code == 201
    seller_id = seller_response.json()["id"]

    for contact_id, role in [(buyer_id, "buyer"), (seller_id, "seller")]:
        link_response = client.post(
            "/api/property-contact-links",
            headers=headers,
            json={"property_id": property_id, "contact_id": contact_id, "role": role},
        )
        assert link_response.status_code == 201

    upload_response = client.post(
        "/api/recordings/upload",
        headers=headers,
        files={"file": ("call.wav", b"audio-bytes", "audio/wav")},
        data={"duration_seconds": "35"},
    )
    assert upload_response.status_code == 201
    recording_id = upload_response.json()["id"]

    transcript_response = client.post(f"/api/recordings/{recording_id}/transcribe", headers=headers)
    assert transcript_response.status_code == 200
    transcript_id = transcript_response.json()["id"]

    update_transcript_response = client.patch(
        f"/api/transcripts/{transcript_id}",
        headers=headers,
        json={
            "raw_text": "Buyer Maya Alvarez wants to visit Harbor House on 2026-06-01 at 15:30. Follow up with Maya Alvarez in 2 days about the decision. Confirm the required documents with seller Ben Foster tomorrow.",
            "language_code": "en",
        },
    )
    assert update_transcript_response.status_code == 200

    extract_response = client.post(f"/api/recordings/{recording_id}/extract-actions", headers=headers)
    assert extract_response.status_code == 200
    extract_body = extract_response.json()
    assert len(extract_body["draft_actions"]) >= 2

    visit_action = next(action for action in extract_body["draft_actions"] if action["action_type"] == "property_visit")
    follow_up_action = next(action for action in extract_body["draft_actions"] if action["action_type"] == "follow_up")
    assert visit_action["property_id"] == property_id
    assert visit_action["contact_id"] == buyer_id
    assert follow_up_action["contact_id"] == buyer_id

    approve_response = client.post(f"/api/draft-actions/{visit_action['id']}/approve", headers=headers)
    assert approve_response.status_code == 200
    assert approve_response.json()["source"] == "ai_draft"

    bulk_response = client.post(
        "/api/draft-actions/bulk-approve",
        headers=headers,
        json={"draft_action_ids": [follow_up_action["id"]]},
    )
    assert bulk_response.status_code == 200
    assert len(bulk_response.json()) == 1

    events_response = client.get("/api/events", headers=headers)
    assert events_response.status_code == 200
    assert len(events_response.json()) == 2


def test_broker_data_is_isolated(client: TestClient) -> None:
    first_headers = register(client, "first@example.com")
    second_headers = register(client, "second@example.com")

    property_response = client.post(
        "/api/properties",
        headers=first_headers,
        json={
            "title": "Private Listing",
            "address_line_1": "1 Hidden Lane",
            "city": "Pune",
            "state": "MH",
            "postal_code": "411001",
            "property_type": "flat",
            "notes": None,
            "is_active": True,
        },
    )
    assert property_response.status_code == 201
    property_id = property_response.json()["id"]

    forbidden = client.get(f"/api/properties/{property_id}", headers=second_headers)
    assert forbidden.status_code == 404


def test_quick_note_skips_transcription_and_extracts_actions(client: TestClient) -> None:
    headers = register(client)

    property_response = client.post(
        "/api/properties",
        headers=headers,
        json={
            "title": "Palm Residency",
            "address_line_1": "44 Lake View",
            "city": "Bengaluru",
            "state": "KA",
            "postal_code": "560001",
            "property_type": "villa",
            "notes": None,
            "is_active": True,
        },
    )
    assert property_response.status_code == 201
    property_id = property_response.json()["id"]

    contact_response = client.post(
        "/api/contacts",
        headers=headers,
        json={"full_name": "Asha Mehta", "phone_number": "7777777777", "email": "asha@example.com"},
    )
    assert contact_response.status_code == 201
    contact_id = contact_response.json()["id"]

    link_response = client.post(
        "/api/property-contact-links",
        headers=headers,
        json={"property_id": property_id, "contact_id": contact_id, "role": "buyer"},
    )
    assert link_response.status_code == 201

    note_response = client.post(
        "/api/recordings/note",
        headers=headers,
        json={
            "raw_text": "Asha Mehta wants to visit Palm Residency on 2026-06-02 at 11:00. Follow up with Asha Mehta tomorrow about financing.",
        },
    )
    assert note_response.status_code == 201
    note_body = note_response.json()
    assert note_body["capture_source"] == "text_note"
    assert note_body["processing_status"] == "transcribed"

    transcript_response = client.get(f"/api/recordings/{note_body['id']}/transcript", headers=headers)
    assert transcript_response.status_code == 200
    assert "Palm Residency" in transcript_response.json()["raw_text"]

    extract_response = client.post(f"/api/recordings/{note_body['id']}/extract-actions", headers=headers)
    assert extract_response.status_code == 200
    draft_actions = extract_response.json()["draft_actions"]
    assert len(draft_actions) >= 2
    assert any(action["property_id"] == property_id for action in draft_actions)
    assert any(action["contact_id"] == contact_id for action in draft_actions)

    transcribe_response = client.post(f"/api/recordings/{note_body['id']}/transcribe", headers=headers)
    assert transcribe_response.status_code == 200
    assert transcribe_response.json()["provider"] == "manual_note"