from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Property Voice Agent API"
    environment: str = "development"
    secret_key: str = Field(default="change-me-in-env")
    access_token_expire_minutes: int = 60 * 24 * 7
    sqlite_filename: str = "app.db"
    data_dir: Path = Field(default_factory=lambda: Path(__file__).resolve().parents[2] / "data")
    frontend_origin: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def database_url(self) -> str:
        return f"sqlite:///{(self.data_dir / self.sqlite_filename).resolve()}"

    @property
    def recording_dir(self) -> Path:
        return self.data_dir / "recordings"


@lru_cache
def get_settings() -> Settings:
    return Settings()
