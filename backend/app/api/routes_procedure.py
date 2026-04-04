from fastapi import APIRouter, HTTPException

from app.models.procedure import (
    ProcedureActionResponse,
    ProcedureCurrentState,
    ProcedureStartRequest,
    ProcedureSummary,
)
from app.services.mission_service import mission_service
from app.services.procedure_service import (
    ProcedureNotActiveError,
    ProcedurePhaseError,
    ProcedureUnknownError,
    procedure_service,
)

router = APIRouter(prefix="/procedure", tags=["procedure"])


@router.get("/list", response_model=list[ProcedureSummary])
def list_procedures() -> list[ProcedureSummary]:
    return procedure_service.list_procedures()


@router.get("/current", response_model=ProcedureCurrentState)
def get_procedure_current() -> ProcedureCurrentState:
    return procedure_service.get_current_state()


@router.post("/start", response_model=ProcedureActionResponse)
def post_procedure_start(body: ProcedureStartRequest) -> ProcedureActionResponse:
    try:
        msg, state = procedure_service.start(body.procedure_id, mission_service.get_phase())
        return ProcedureActionResponse(message=msg, state=state)
    except ProcedureUnknownError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    except ProcedurePhaseError as e:
        raise HTTPException(status_code=400, detail=e.message) from e


@router.post("/next", response_model=ProcedureActionResponse)
def post_procedure_next() -> ProcedureActionResponse:
    try:
        msg, state = procedure_service.next_step()
        return ProcedureActionResponse(message=msg, state=state)
    except ProcedureNotActiveError as e:
        raise HTTPException(status_code=400, detail=e.message) from e


@router.post("/repeat", response_model=ProcedureActionResponse)
def post_procedure_repeat() -> ProcedureActionResponse:
    try:
        msg, state = procedure_service.repeat_step()
        return ProcedureActionResponse(message=msg, state=state)
    except ProcedureNotActiveError as e:
        raise HTTPException(status_code=400, detail=e.message) from e
