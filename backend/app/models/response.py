from typing import Optional

from pydantic import BaseModel, Field


class CommandResponse(BaseModel):
    """Structured reply from POST /command — shared API contract with the frontend."""

    success: bool = Field(True, description="False when guardrails rejected the command")
    error_code: Optional[str] = Field(None, description="Stable machine-readable reason when success is false")
    input_text: str = Field(..., description="Echo of the submitted command text")
    parsed_intent: str = Field(..., description="Canonical intent from the parser")
    entity: Optional[str] = Field(None, description="Subsystem or procedure target when applicable")
    response_text: str = Field(..., description="Assistant message or safe guardrail explanation")
