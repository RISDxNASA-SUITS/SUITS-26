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

    # Agentic mode: local LLM (Ollama) router, telemetry Q&A, voiced alerts.
    agentic_enabled: bool = Field(
        default=False,
        description="If true, POST /command and ASR auto-route use LLM router instead of rule parser.",
    )
    ollama_base_url: str = Field(
        default="http://127.0.0.1:11434",
        description="Ollama API base URL (no trailing slash).",
    )
    ollama_model: str = Field(
        default="llama3.2",
        description="Model name as known to Ollama (ollama pull <name>).",
    )
    ollama_timeout_s: float = Field(default=120.0, description="HTTP timeout for Ollama chat requests.")
    telemetry_json_path: str | None = Field(
        default=None,
        description="Optional path to JSON file (TelemetrySnapshot shape); poller syncs into telemetry service.",
    )
    telemetry_json_poll_interval_s: float = Field(default=1.0, description="How often to re-read telemetry JSON.")
    alert_poll_interval_s: float = Field(default=2.0, description="How often the alert monitor checks warnings.")
    agent_alerts_max: int = Field(default=50, description="Max alert entries kept in memory for GET /agent/alerts.")


settings = Settings()
