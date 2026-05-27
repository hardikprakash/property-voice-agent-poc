from __future__ import annotations

import importlib

from sqlmodel import Session, select


def test_seed_demo_data_creates_varied_demo_records(tmp_path, monkeypatch) -> None:
    monkeypatch.setenv("DATA_DIR", str(tmp_path / "data"))
    monkeypatch.setenv("SQLITE_FILENAME", "demo.db")

    from app.core import config as config_module

    config_module.get_settings.cache_clear()

    import app.db as db_module
    import app.demo_seed as seed_module
    from app.models import AudioRecording, Broker, CalendarEvent, Contact, DraftAction, Property, Transcript

    db_module = importlib.reload(db_module)
    seed_module = importlib.reload(seed_module)

    summary = seed_module.seed_demo_data()

    assert summary["broker_email"] == seed_module.DEMO_EMAIL
    assert summary["properties"] == 4
    assert summary["recordings"] == 5
    assert summary["draft_actions"] == 5
    assert summary["events"] == 4

    with Session(db_module.engine) as session:
        broker = session.exec(select(Broker).where(Broker.email == seed_module.DEMO_EMAIL)).first()
        assert broker is not None
        assert len(session.exec(select(Property).where(Property.broker_id == broker.id)).all()) == 4
        assert len(session.exec(select(Contact).where(Contact.broker_id == broker.id)).all()) == 6
        assert len(session.exec(select(AudioRecording).where(AudioRecording.broker_id == broker.id)).all()) == 5
        assert len(session.exec(select(Transcript).where(Transcript.broker_id == broker.id)).all()) == 4
        assert len(session.exec(select(DraftAction).where(DraftAction.broker_id == broker.id)).all()) == 5
        assert len(session.exec(select(CalendarEvent).where(CalendarEvent.broker_id == broker.id)).all()) == 4

        recordings = session.exec(select(AudioRecording).where(AudioRecording.broker_id == broker.id)).all()
        assert any(recording.capture_source == "text_note" for recording in recordings)
        assert any(recording.processing_status == "uploaded" for recording in recordings)