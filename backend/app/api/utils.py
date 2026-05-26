import json

from fastapi import HTTPException, status
from sqlmodel import Session

from app.models import Transcript, utcnow


def owned_or_404(session: Session, model: type, item_id: str, broker_id: str):
    item = session.get(model, item_id)
    if item is None or getattr(item, "broker_id", None) != broker_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    return item


def apply_updates(instance, payload) -> None:
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(instance, key, value)
    instance.updated_at = utcnow()


def parse_unresolved_fields(value: str | None) -> list[str]:
    if not value:
        return []
    try:
        decoded = json.loads(value)
    except json.JSONDecodeError:
        return []
    return [item for item in decoded if isinstance(item, str)]


def latest_transcript(session: Session, recording_id: str) -> Transcript | None:
    from sqlmodel import select

    return session.exec(
        select(Transcript).where(Transcript.recording_id == recording_id).order_by(Transcript.created_at.desc())
    ).first()