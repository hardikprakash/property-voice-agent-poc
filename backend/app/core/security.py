import base64
import hashlib
import hmac
import secrets
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status
from jose import JWTError, jwt

ALGORITHM = "HS256"
PBKDF2_SCHEME = "pbkdf2-sha256"
PBKDF2_ROUNDS = 29000
PBKDF2_SALT_BYTES = 16


def _b64encode(value: bytes) -> str:
    return base64.b64encode(value).decode("ascii").rstrip("=")


def _b64decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.b64decode(value + padding)


def _pbkdf2_checksum(password: str, salt: bytes, rounds: int, dklen: int = 32) -> bytes:
    return hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, rounds, dklen=dklen)


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(PBKDF2_SALT_BYTES)
    checksum = _pbkdf2_checksum(password, salt, PBKDF2_ROUNDS)
    return f"${PBKDF2_SCHEME}${PBKDF2_ROUNDS}${_b64encode(salt)}${_b64encode(checksum)}"


def verify_password(password: str, password_hash: str) -> bool:
    try:
        _, scheme, rounds_text, salt_token, checksum_token = password_hash.split("$")
        if scheme != PBKDF2_SCHEME:
            return False
        rounds = int(rounds_text)
        salt = _b64decode(salt_token)
        expected_checksum = _b64decode(checksum_token)
    except (TypeError, ValueError):
        return False

    actual_checksum = _pbkdf2_checksum(password, salt, rounds, dklen=len(expected_checksum))
    return hmac.compare_digest(actual_checksum, expected_checksum)


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
