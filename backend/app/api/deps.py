from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlmodel import Session

from app.core.config import get_settings
from app.core.security import decode_subject
from app.db import get_session
from app.models import Broker


settings = get_settings()
bearer_scheme = HTTPBearer(auto_error=False)


def get_current_broker(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    session: Session = Depends(get_session),
) -> Broker:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    broker_id = decode_subject(credentials.credentials, settings.secret_key)
    broker = session.get(Broker, broker_id)
    if broker is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return broker