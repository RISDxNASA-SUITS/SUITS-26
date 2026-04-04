from enum import Enum

from pydantic import BaseModel, Field


class MissionPhase(str, Enum):
    INIT = "INIT"
    PR_SEARCH = "PR_SEARCH"
    EGRESS = "EGRESS"
    EVA_NAV = "EVA_NAV"
    LTV_REPAIR = "LTV_REPAIR"
    INGRESS = "INGRESS"
    COMPLETE = "COMPLETE"


class MissionState(BaseModel):
    """Current mission state exposed by GET /mission."""

    phase: MissionPhase = Field(..., description="Current mission phase")


class MissionPhaseUpdateRequest(BaseModel):
    """Body for POST /mission/phase."""

    phase: MissionPhase = Field(..., description="Target mission phase")
