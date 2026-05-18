from typing import Optional

from pydantic import BaseModel, Field

from app.models.mission import MissionPhase


class ProcedureStep(BaseModel):
    step_id: str = Field(..., min_length=1)
    instruction: str = Field(..., min_length=1)
    check_key: Optional[str] = Field(None, description="Optional telemetry/check placeholder id")


class ProcedureDefinition(BaseModel):
    procedure_id: str = Field(..., min_length=1)
    title: str = Field(..., min_length=1)
    allowed_phase: MissionPhase = Field(..., description="Mission phase required to start this procedure")
    steps: list[ProcedureStep] = Field(..., min_length=1)


class ProcedureSummary(BaseModel):
    procedure_id: str
    title: str
    allowed_phase: MissionPhase


class ProcedureCurrentState(BaseModel):
    """Runtime procedure progress for API and UI."""

    active: bool = Field(..., description="True when a procedure is in progress")
    procedure_id: Optional[str] = None
    title: Optional[str] = None
    allowed_phase: Optional[MissionPhase] = None
    step_index: Optional[int] = Field(None, description="0-based index of current step")
    step_count: Optional[int] = None
    current_step_id: Optional[str] = None
    instruction: Optional[str] = None
    check_key: Optional[str] = None


class ProcedureStartRequest(BaseModel):
    procedure_id: str = Field(..., min_length=1)


class ProcedureActionResponse(BaseModel):
    message: str
    state: ProcedureCurrentState
