import pytest

from app.models.mission import MissionPhase
from app.services.mission_service import mission_service
from app.services.procedure_service import procedure_service
from app.services.telemetry_service import telemetry_service


@pytest.fixture(autouse=True)
def reset_singleton_state():
    """Avoid cross-test leakage for shared in-memory services."""
    mission_service.set_phase(MissionPhase.INIT)
    telemetry_service.seed_training()
    procedure_service.reset_idle()
    yield
