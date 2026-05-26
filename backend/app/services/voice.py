from __future__ import annotations

from datetime import UTC, datetime
import json
from pathlib import Path

import httpx

from app.core.config import Settings
from app.models import AudioRecording, Contact, Property, PropertyContactLink
from app.voice_pipeline import DraftCandidate, build_stub_transcript, extract_draft_candidates


SUPPORTED_ACTION_TYPES = {
    "property_visit",
    "follow_up",
    "document_check",
    "reply",
    "confirmation",
    "generic_follow_up",
}
ALLOWED_UNRESOLVED_FIELDS = {"property_id", "contact_id", "timing"}
EXTRACTION_RESPONSE_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "summary": {"type": "string"},
        "actions": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "action_type": {
                        "type": "string",
                        "enum": sorted(SUPPORTED_ACTION_TYPES),
                    },
                    "title": {"type": "string"},
                    "description": {"type": ["string", "null"]},
                    "property_id": {"type": ["string", "null"]},
                    "contact_id": {"type": ["string", "null"]},
                    "contact_role": {"type": ["string", "null"]},
                    "starts_at": {"type": ["string", "null"]},
                    "ends_at": {"type": ["string", "null"]},
                    "due_at": {"type": ["string", "null"]},
                    "confidence_label": {
                        "type": "string",
                        "enum": ["high", "medium", "low"],
                    },
                    "unresolved_fields": {
                        "type": "array",
                        "items": {"type": "string"},
                    },
                    "source_line": {"type": "string"},
                },
                "required": [
                    "action_type",
                    "title",
                    "description",
                    "property_id",
                    "contact_id",
                    "contact_role",
                    "starts_at",
                    "ends_at",
                    "due_at",
                    "confidence_label",
                    "unresolved_fields",
                    "source_line",
                ],
            },
        },
    },
    "required": ["summary", "actions"],
}


class VoiceProviderError(RuntimeError):
    pass


def generate_transcript_text(
    recording: AudioRecording,
    settings: Settings,
    transport: httpx.BaseTransport | None = None,
) -> str:
    provider = settings.transcription_provider.lower().strip()
    if provider == "stub":
        return build_stub_transcript(recording, settings.transcription_provider)
    if provider == "openai":
        return _transcribe_with_openai(recording, settings, transport=transport)
    raise VoiceProviderError(f"Unsupported transcription provider '{settings.transcription_provider}'.")


def generate_draft_candidates(
    transcript_text: str,
    properties: list[Property],
    contacts: list[Contact],
    links: list[PropertyContactLink],
    settings: Settings,
    now: datetime | None = None,
    transport: httpx.BaseTransport | None = None,
) -> tuple[list[DraftCandidate], dict[str, object]]:
    provider = settings.extraction_provider.lower().strip()
    if provider == "stub":
        return extract_draft_candidates(transcript_text, properties, contacts, links, now=now)
    if provider == "openrouter":
        return _extract_with_openrouter(
            transcript_text,
            properties,
            contacts,
            links,
            settings,
            now=now,
            transport=transport,
        )
    raise VoiceProviderError(f"Unsupported extraction provider '{settings.extraction_provider}'.")


def _transcribe_with_openai(
    recording: AudioRecording,
    settings: Settings,
    transport: httpx.BaseTransport | None = None,
) -> str:
    if not settings.transcription_api_key:
        raise VoiceProviderError("TRANSCRIPTION_API_KEY is required when TRANSCRIPTION_PROVIDER=openai.")

    recording_path = Path(recording.storage_path)
    if not recording_path.exists():
        raise VoiceProviderError(f"Recording file is missing at '{recording.storage_path}'.")

    with httpx.Client(
        base_url=_normalized_base_url(settings.transcription_base_url),
        timeout=settings.transcription_timeout_seconds,
        transport=transport,
    ) as client:
        with recording_path.open("rb") as file_handle:
            response = client.post(
                "audio/transcriptions",
                headers={"Authorization": f"Bearer {settings.transcription_api_key}"},
                data={
                    "model": settings.transcription_model,
                    "language": settings.transcription_language_code,
                    "response_format": "json",
                },
                files={
                    "file": (
                        recording.original_filename,
                        file_handle,
                        recording.mime_type,
                    )
                },
            )

    try:
        response.raise_for_status()
    except httpx.HTTPError as exc:
        raise VoiceProviderError(f"Transcription request failed: {exc}") from exc

    payload = response.json()
    transcript_text = payload.get("text")
    if not isinstance(transcript_text, str) or not transcript_text.strip():
        raise VoiceProviderError("Transcription provider returned an empty transcript.")
    return transcript_text.strip()


def _extract_with_openrouter(
    transcript_text: str,
    properties: list[Property],
    contacts: list[Contact],
    links: list[PropertyContactLink],
    settings: Settings,
    now: datetime | None = None,
    transport: httpx.BaseTransport | None = None,
) -> tuple[list[DraftCandidate], dict[str, object]]:
    if not settings.extraction_api_key:
        raise VoiceProviderError("EXTRACTION_API_KEY is required when EXTRACTION_PROVIDER=openrouter.")

    headers = {
        "Authorization": f"Bearer {settings.extraction_api_key}",
        "Content-Type": "application/json",
    }
    if settings.openrouter_site_url:
        headers["HTTP-Referer"] = settings.openrouter_site_url
    if settings.openrouter_app_name:
        headers["X-Title"] = settings.openrouter_app_name

    with httpx.Client(
        base_url=_normalized_base_url(settings.extraction_base_url),
        timeout=settings.extraction_timeout_seconds,
        transport=transport,
    ) as client:
        response = client.post(
            "chat/completions",
            headers=headers,
            json={
                "model": settings.extraction_model,
                "messages": [
                    {
                        "role": "system",
                        "content": _build_extraction_system_prompt(settings.extraction_prompt_version),
                    },
                    {
                        "role": "user",
                        "content": _build_extraction_user_prompt(transcript_text, properties, contacts, links),
                    },
                ],
                "response_format": {
                    "type": "json_schema",
                    "json_schema": {
                        "name": "draft_action_response",
                        "strict": True,
                        "schema": EXTRACTION_RESPONSE_SCHEMA,
                    },
                },
            },
        )

    try:
        response.raise_for_status()
    except httpx.HTTPError as exc:
        raise VoiceProviderError(f"Extraction request failed: {exc}") from exc

    raw_response = response.json()
    content = _extract_message_content(raw_response)

    try:
        provider_payload = json.loads(content)
    except json.JSONDecodeError as exc:
        raise VoiceProviderError("Extraction provider returned invalid JSON content.") from exc

    actions = provider_payload.get("actions")
    if not isinstance(actions, list):
        raise VoiceProviderError("Extraction provider response did not contain an actions array.")

    candidates = _draft_candidates_from_payload(actions, properties, contacts, links)
    if candidates:
        return candidates, raw_response

    fallback_candidates, fallback_raw = extract_draft_candidates(transcript_text, properties, contacts, links, now=now)
    return fallback_candidates, {"provider_response": raw_response, "fallback": fallback_raw}


def _build_extraction_system_prompt(prompt_version: str) -> str:
    return "\n".join(
        [
            f"You are extracting reviewed draft actions for property brokers. Prompt version: {prompt_version}.",
            "Only use property_id and contact_id values that appear in the provided context.",
            "If a match is unclear, set the id field to null and include the field name in unresolved_fields.",
            "If no explicit timing is present, leave the datetime fields null and include timing in unresolved_fields.",
            "Return ISO 8601 datetimes. Use UTC when you infer or normalize a time.",
            "Do not invent people, properties, or times.",
            "Prefer concise action titles that a broker can approve into the in-app calendar.",
        ]
    )


def _build_extraction_user_prompt(
    transcript_text: str,
    properties: list[Property],
    contacts: list[Contact],
    links: list[PropertyContactLink],
) -> str:
    payload = {
        "transcript": transcript_text,
        "properties": [
            {
                "id": property_.id,
                "title": property_.title,
                "address_line_1": property_.address_line_1,
                "city": property_.city,
                "state": property_.state,
            }
            for property_ in properties
        ],
        "contacts": [
            {
                "id": contact.id,
                "full_name": contact.full_name,
                "email": contact.email,
                "phone_number": contact.phone_number,
            }
            for contact in contacts
        ],
        "property_contact_links": [
            {
                "property_id": link.property_id,
                "contact_id": link.contact_id,
                "role": link.role,
            }
            for link in links
        ],
    }
    return json.dumps(payload, indent=2)


def _draft_candidates_from_payload(
    actions: list[object],
    properties: list[Property],
    contacts: list[Contact],
    links: list[PropertyContactLink],
) -> list[DraftCandidate]:
    property_ids = {property_.id for property_ in properties}
    contact_ids = {contact.id for contact in contacts}
    candidates: list[DraftCandidate] = []

    for item in actions:
        if not isinstance(item, dict):
            continue

        property_id = _known_id(item.get("property_id"), property_ids)
        contact_id = _known_id(item.get("contact_id"), contact_ids)
        starts_at = _parse_provider_datetime(item.get("starts_at"))
        ends_at = _parse_provider_datetime(item.get("ends_at"))
        due_at = _parse_provider_datetime(item.get("due_at"))
        unresolved_fields = [
            field
            for field in item.get("unresolved_fields", [])
            if isinstance(field, str) and field in ALLOWED_UNRESOLVED_FIELDS
        ]

        if property_id is None and "property_id" not in unresolved_fields:
            unresolved_fields.append("property_id")
        if contact_id is None and "contact_id" not in unresolved_fields:
            unresolved_fields.append("contact_id")
        if starts_at is None and due_at is None and "timing" not in unresolved_fields:
            unresolved_fields.append("timing")

        action_type = item.get("action_type") if isinstance(item.get("action_type"), str) else "generic_follow_up"
        if action_type not in SUPPORTED_ACTION_TYPES:
            action_type = "generic_follow_up"

        contact_role = item.get("contact_role") if isinstance(item.get("contact_role"), str) else None
        if contact_role is None:
            contact_role = _role_from_link(property_id, contact_id, links)

        title = item.get("title") if isinstance(item.get("title"), str) and item.get("title").strip() else "Review call and capture next step"
        description = item.get("description") if isinstance(item.get("description"), str) and item.get("description").strip() else None
        confidence_label = item.get("confidence_label") if item.get("confidence_label") in {"high", "medium", "low"} else "medium"
        source_line = item.get("source_line") if isinstance(item.get("source_line"), str) and item.get("source_line").strip() else transcript_excerpt(description, title)

        candidates.append(
            DraftCandidate(
                property_id=property_id,
                contact_id=contact_id,
                contact_role=contact_role,
                action_type=action_type,
                title=title.strip(),
                description=description,
                starts_at=starts_at,
                ends_at=ends_at,
                due_at=due_at,
                confidence_label=confidence_label,
                unresolved_fields=unresolved_fields,
                source_line=source_line,
            )
        )

    return candidates


def _extract_message_content(raw_response: dict[str, object]) -> str:
    choices = raw_response.get("choices")
    if not isinstance(choices, list) or not choices:
        raise VoiceProviderError("Extraction provider returned no choices.")

    first_choice = choices[0]
    if not isinstance(first_choice, dict):
        raise VoiceProviderError("Extraction provider returned an invalid choice payload.")

    message = first_choice.get("message")
    if not isinstance(message, dict):
        raise VoiceProviderError("Extraction provider returned no message content.")

    content = message.get("content")
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        text_parts: list[str] = []
        for item in content:
            if isinstance(item, dict) and isinstance(item.get("text"), str):
                text_parts.append(item["text"])
        if text_parts:
            return "".join(text_parts)

    raise VoiceProviderError("Extraction provider returned unreadable message content.")


def _parse_provider_datetime(value: object) -> datetime | None:
    if not isinstance(value, str) or not value.strip():
        return None
    normalized = value.strip().replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=UTC)
    return parsed.astimezone(UTC)


def _known_id(value: object, known_ids: set[str]) -> str | None:
    if isinstance(value, str) and value in known_ids:
        return value
    return None


def _role_from_link(property_id: str | None, contact_id: str | None, links: list[PropertyContactLink]) -> str | None:
    if property_id is None or contact_id is None:
        return None
    for link in links:
        if link.property_id == property_id and link.contact_id == contact_id:
            return link.role
    return None


def transcript_excerpt(description: str | None, fallback: str) -> str:
    if description:
        return description[:500]
    return fallback[:500]


def _normalized_base_url(value: str) -> str:
    return value.rstrip("/") + "/"