from threading import Lock
from typing import Optional

from app.core.demo_seed import initial_mission_phase_for_app
from app.models.mission import MissionPhase


class MissionService:
    """In-memory mission phase with thread-safe get/set."""

    def __init__(self, initial_phase: Optional[MissionPhase] = None) -> None:
        self._lock = Lock()
        self._phase: MissionPhase = (
            initial_phase if initial_phase is not None else initial_mission_phase_for_app()
        )

    def get_phase(self) -> MissionPhase:
        with self._lock:
            return self._phase

    def set_phase(self, phase: MissionPhase) -> MissionPhase:
        """Set phase; returns the new phase."""
        with self._lock:
            self._phase = phase
            return self._phase


mission_service = MissionService()
