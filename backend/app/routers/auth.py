from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.api.deps import get_current_broker
from app.api.serializers import as_broker_read, build_auth_session
from app.core.security import hash_password, verify_password
from app.db import get_session
from app.models import Broker
from app.schemas import AuthSession, BrokerLogin, BrokerRead, BrokerRegister


router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=AuthSession, status_code=status.HTTP_201_CREATED)
def register(payload: BrokerRegister, session: Session = Depends(get_session)) -> AuthSession:
    existing = session.exec(select(Broker).where(Broker.email == payload.email)).first()
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    broker = Broker(
        email=payload.email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
    )
    session.add(broker)
    session.commit()
    session.refresh(broker)
    return build_auth_session(broker)


@router.post("/login", response_model=AuthSession)
def login(payload: BrokerLogin, session: Session = Depends(get_session)) -> AuthSession:
    broker = session.exec(select(Broker).where(Broker.email == payload.email)).first()
    if broker is None or not verify_password(payload.password, broker.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return build_auth_session(broker)


@router.post("/logout")
def logout() -> dict[str, str]:
    return {"detail": "Logged out"}


@router.get("/me", response_model=BrokerRead)
def me(current_broker: Broker = Depends(get_current_broker)) -> BrokerRead:
    return as_broker_read(current_broker)