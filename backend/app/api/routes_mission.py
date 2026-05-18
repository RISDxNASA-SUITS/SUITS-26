from fastapi import APIRouter

from app.models.mission import MissionPhaseUpdateRequest, MissionState
from app.services.mission_service import mission_service

router = APIRouter(prefix="/mission", tags=["mission"])


@router.get("", response_model=MissionState)
def get_mission() -> MissionState:
    return MissionState(phase=mission_service.get_phase())


@router.post("/phase", response_model=MissionState)
def post_mission_phase(body: MissionPhaseUpdateRequest) -> MissionState:
    mission_service.set_phase(body.phase)
    return MissionState(phase=mission_service.get_phase())
