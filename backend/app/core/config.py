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

    # Local ASR (faster-whisper). See README for setup; requires ffmpeg for webm/mp3.
    asr_enabled: bool = Field(default=True, description="Enable POST /asr/transcribe.")
    asr_model_size: str = Field(default="base", description="Whisper model id, e.g. tiny, base, small.")
    asr_device: str = Field(default="cpu", description="cpu or cuda.")
    asr_compute_type: str = Field(default="int8", description="e.g. int8, float16 (device-dependent).")
    asr_min_avg_logprob: float = Field(
        default=-2.0,
        description="Reject transcription when mean segment avg_logprob is below this (more negative = worse).",
    )
    asr_max_no_speech_prob: float = Field(
        default=0.75,
        description="Reject when Whisper reports no_speech_prob above this.",
    )


settings = Settings()
