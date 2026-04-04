from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration."""

    model_config = SettingsConfigDict(env_prefix="EVA_", env_file=".env", extra="ignore")

    app_name: str = "EVA Mission Assistant API"
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    demo_mode: bool = Field(
        default=True,
        description="If true, start in EGRESS with DEMO_TELEMETRY; if false, INIT + training telemetry.",
    )


settings = Settings()
