from typing import Optional

from pydantic import BaseModel, Field


class ParseResult(BaseModel):
    """Output of the rule-based command parser (deterministic, no ML)."""

    intent: str = Field(..., description="Canonical intent id")
    entity: Optional[str] = Field(
        None,
        description="Subsystem or procedure target when applicable (e.g. oxygen, egress, erm)",
    )
    raw_text: str = Field(..., description="Normalized input text used for matching (trimmed)")
