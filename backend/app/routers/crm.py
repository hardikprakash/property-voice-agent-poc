from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from app.api.deps import get_current_broker
from app.api.serializers import as_contact_read, as_event_read, as_property_contact_link_read, as_property_read
from app.api.utils import apply_updates, owned_or_404
from app.db import get_session
from app.models import Broker, CalendarEvent, Contact, Property, PropertyContactLink
from app.schemas import (
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


router = APIRouter(prefix="/api", tags=["crm"])


@router.get("/properties", response_model=list[PropertyRead])
def list_properties(
    current_broker: Broker = Depends(get_current_broker),
    session: Session = Depends(get_session),
) -> list[PropertyRead]:
    rows = session.exec(
        select(Property).where(Property.broker_id == current_broker.id).order_by(Property.created_at.desc())
    ).all()
    return [as_property_read(row) for row in rows]


@router.post("/properties", response_model=PropertyRead, status_code=status.HTTP_201_CREATED)
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


@router.get("/properties/{property_id}", response_model=PropertyRead)
def get_property(
    property_id: str,
    current_broker: Broker = Depends(get_current_broker),
    session: Session = Depends(get_session),
) -> PropertyRead:
    return as_property_read(owned_or_404(session, Property, property_id, current_broker.id))


@router.patch("/properties/{property_id}", response_model=PropertyRead)
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


@router.delete("/properties/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_property(
    property_id: str,
    current_broker: Broker = Depends(get_current_broker),
    session: Session = Depends(get_session),
) -> None:
    session.delete(owned_or_404(session, Property, property_id, current_broker.id))
    session.commit()


@router.get("/contacts", response_model=list[ContactRead])
def list_contacts(
    current_broker: Broker = Depends(get_current_broker),
    session: Session = Depends(get_session),
) -> list[ContactRead]:
    rows = session.exec(
        select(Contact).where(Contact.broker_id == current_broker.id).order_by(Contact.created_at.desc())
    ).all()
    return [as_contact_read(row) for row in rows]


@router.post("/contacts", response_model=ContactRead, status_code=status.HTTP_201_CREATED)
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


@router.get("/contacts/{contact_id}", response_model=ContactRead)
def get_contact(
    contact_id: str,
    current_broker: Broker = Depends(get_current_broker),
    session: Session = Depends(get_session),
) -> ContactRead:
    return as_contact_read(owned_or_404(session, Contact, contact_id, current_broker.id))


@router.patch("/contacts/{contact_id}", response_model=ContactRead)
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


@router.delete("/contacts/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contact(
    contact_id: str,
    current_broker: Broker = Depends(get_current_broker),
    session: Session = Depends(get_session),
) -> None:
    session.delete(owned_or_404(session, Contact, contact_id, current_broker.id))
    session.commit()


@router.get("/property-contact-links", response_model=list[PropertyContactLinkRead])
def list_property_contact_links(
    property_id: str | None = Query(default=None),
    contact_id: str | None = Query(default=None),
    current_broker: Broker = Depends(get_current_broker),
    session: Session = Depends(get_session),
) -> list[PropertyContactLinkRead]:
    statement = select(PropertyContactLink).where(PropertyContactLink.broker_id == current_broker.id)
    if property_id is not None:
        statement = statement.where(PropertyContactLink.property_id == property_id)
    if contact_id is not None:
        statement = statement.where(PropertyContactLink.contact_id == contact_id)
    rows = session.exec(statement.order_by(PropertyContactLink.created_at.desc())).all()
    return [as_property_contact_link_read(row) for row in rows]


@router.post("/property-contact-links", response_model=PropertyContactLinkRead, status_code=status.HTTP_201_CREATED)
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


@router.patch("/property-contact-links/{link_id}", response_model=PropertyContactLinkRead)
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


@router.delete("/property-contact-links/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_property_contact_link(
    link_id: str,
    current_broker: Broker = Depends(get_current_broker),
    session: Session = Depends(get_session),
) -> None:
    session.delete(owned_or_404(session, PropertyContactLink, link_id, current_broker.id))
    session.commit()


@router.get("/events", response_model=list[CalendarEventRead])
def list_events(
    current_broker: Broker = Depends(get_current_broker),
    session: Session = Depends(get_session),
) -> list[CalendarEventRead]:
    rows = session.exec(
        select(CalendarEvent).where(CalendarEvent.broker_id == current_broker.id).order_by(CalendarEvent.created_at.desc())
    ).all()
    return [as_event_read(row) for row in rows]


@router.post("/events", response_model=CalendarEventRead, status_code=status.HTTP_201_CREATED)
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


@router.get("/events/{event_id}", response_model=CalendarEventRead)
def get_event(
    event_id: str,
    current_broker: Broker = Depends(get_current_broker),
    session: Session = Depends(get_session),
) -> CalendarEventRead:
    return as_event_read(owned_or_404(session, CalendarEvent, event_id, current_broker.id))


@router.patch("/events/{event_id}", response_model=CalendarEventRead)
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


@router.delete("/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    event_id: str,
    current_broker: Broker = Depends(get_current_broker),
    session: Session = Depends(get_session),
) -> None:
    session.delete(owned_or_404(session, CalendarEvent, event_id, current_broker.id))
    session.commit()