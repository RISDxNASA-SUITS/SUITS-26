from pydantic import BaseModel, Field


class AgentAlertItem(BaseModel):
    """A single LLM-phrased alert from the threshold monitor."""

    id: int = Field(..., description="Monotonic id for client deduplication")
    timestamp_unix: float = Field(..., description="Unix time when alert was recorded")
    codes: list[str] = Field(..., description="Warning codes that triggered this alert")
    spoken_text: str = Field(..., description="Short voice-friendly alert text")


class AgentStatusResponse(BaseModel):
    agentic_enabled: bool
    telemetry_json_poll: bool
