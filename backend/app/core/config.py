from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_ROOT = Path(__file__).resolve().parents[2]
PROJECT_ROOT = BACKEND_ROOT.parent


class Settings(BaseSettings):
    app_name: str = "Property Voice Agent API"
    environment: str = "development"
    secret_key: str = Field(default="change-me-in-env")
    access_token_expire_minutes: int = 60 * 24 * 7
    sqlite_filename: str = "app.db"
    data_dir: Path = Field(default_factory=lambda: BACKEND_ROOT / "data")
    frontend_origin: str = "http://localhost:5173"
    transcription_provider: str = "stub"
    transcription_model: str = "stub-transcriber-v1"
    transcription_base_url: str = "https://api.openai.com/v1"
    transcription_api_key: str | None = None
    transcription_timeout_seconds: float = 60.0
    transcription_language_code: str = "en"
    extraction_provider: str = "stub"
    extraction_model: str = "stub-extractor-v1"
    extraction_base_url: str = "https://openrouter.ai/api/v1"
    extraction_api_key: str | None = None
    extraction_timeout_seconds: float = 60.0
    extraction_prompt_version: str = "v1"
    openrouter_site_url: str | None = None
    openrouter_app_name: str = "Property Voice Agent PoC"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @field_validator("data_dir", mode="before")
    @classmethod
    def resolve_data_dir(cls, value: str | Path) -> Path:
        path = Path(value)
        if path.is_absolute():
            return path
        if path.parts[:1] == ("backend",):
            return (PROJECT_ROOT / path).resolve()
        return (BACKEND_ROOT / path).resolve()

    @property
    def database_url(self) -> str:
        return f"sqlite:///{(self.data_dir / self.sqlite_filename).resolve()}"

    @property
    def recording_dir(self) -> Path:
        return self.data_dir / "recordings"


@lru_cache
def get_settings() -> Settings:
    return Settings()
