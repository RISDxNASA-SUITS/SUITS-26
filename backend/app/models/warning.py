from pydantic import BaseModel, Field


class WarningItem(BaseModel):
    """Single derived caution from live telemetry (deterministic rules)."""

    code: str = Field(..., description="Stable warning id")
    severity: str = Field(..., description="caution | warning")
    message: str = Field(..., description="Concise crew-facing line")
