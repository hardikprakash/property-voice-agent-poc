from app.core.security import hash_password, verify_password


LEGACY_PASSLIB_HASH = "$pbkdf2-sha256$29000$JuRcixGCUMp5r9Wa856z9g$5OMHmF6Se1i3T6mTwUCOj8kLFsjUaO2P7x02qNb5nwE"


def test_hash_password_round_trips() -> None:
    password_hash = hash_password("secret123")

    assert password_hash.startswith("$pbkdf2-sha256$")
    assert verify_password("secret123", password_hash)
    assert not verify_password("wrong-password", password_hash)


def test_verify_password_accepts_legacy_passlib_hash() -> None:
    assert verify_password("secret123", LEGACY_PASSLIB_HASH)
    assert not verify_password("wrong-password", LEGACY_PASSLIB_HASH)