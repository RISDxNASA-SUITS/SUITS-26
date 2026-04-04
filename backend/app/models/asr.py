"""Response models for POST /asr/transcribe."""

from typing import Optional

from pydantic import BaseModel, Field


class AsrCommandResultPayload(BaseModel):
    """Subset of command outcome for voice responses (mirrors key /command fields)."""

    intent: str = Field(..., description="Parsed intent after normalization")
    response_text: str = Field(..., description="Assistant reply or guardrail message")
    success: bool = True
    error_code: Optional[str] = None
    entity: Optional[str] = None


class AsrTranscribeResponse(BaseModel):
    success: bool
    transcript: str = ""
    normalized_text: str = ""
    error: Optional[str] = None
    command_result: Optional[AsrCommandResultPayload] = None
    avg_logprob: Optional[float] = Field(None, description="Diagnostics only; Whisper segment quality")
