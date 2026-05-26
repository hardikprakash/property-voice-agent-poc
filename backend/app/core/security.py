from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status
from jose import JWTError, jwt
from passlib.context import CryptContext

ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def create_access_token(subject: str, secret_key: str, expires_minutes: int) -> str:
    expire_at = datetime.now(UTC) + timedelta(minutes=expires_minutes)
    payload = {"sub": subject, "exp": expire_at}
    return jwt.encode(payload, secret_key, algorithm=ALGORITHM)


def decode_subject(token: str, secret_key: str) -> str:
    try:
        payload = jwt.decode(token, secret_key, algorithms=[ALGORITHM])
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token") from exc

    subject = payload.get("sub")
    if not subject:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    return subject
