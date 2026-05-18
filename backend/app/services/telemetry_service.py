from copy import deepcopy
from threading import Lock

from app.core.config import settings
from app.core.demo_seed import TRAINING_TELEMETRY, initial_telemetry_snapshot
from app.models.telemetry import TelemetrySnapshot, TelemetryUpdate


class TelemetryService:
    """In-memory telemetry store with thread-safe read/update."""

    def __init__(self) -> None:
        self._lock = Lock()
        self._available: bool = True
        if settings.live_telemetry_enabled:
            self._snapshot = TRAINING_TELEMETRY.model_copy(deep=True)
        else:
            self._snapshot = initial_telemetry_snapshot()

    def is_available(self) -> bool:
        """When False, status queries must not assert live suit values (guardrail)."""
        with self._lock:
            return self._available

    def set_available(self, available: bool) -> None:
        with self._lock:
            self._available = available

    def get_snapshot(self) -> TelemetrySnapshot:
        with self._lock:
            return deepcopy(self._snapshot)

    def update(self, patch: TelemetryUpdate) -> TelemetrySnapshot:
        """Apply partial update; returns the new snapshot."""
        data = patch.model_dump(exclude_unset=True)
        with self._lock:
            current = self._snapshot.model_dump()
            current.update(data)
            self._snapshot = TelemetrySnapshot.model_validate(current)
            return deepcopy(self._snapshot)

    def seed_training(self) -> None:
        """Reset to training snapshot (tests). Independent of demo_mode."""
        with self._lock:
            self._available = True
            self._snapshot = TRAINING_TELEMETRY.model_copy(deep=True)

    def reset_to_defaults(self) -> None:
        """Restore startup defaults (respects EVA_DEMO_MODE)."""
        with self._lock:
            self._available = True
            self._snapshot = initial_telemetry_snapshot()

    def replace_snapshot(self, snapshot: TelemetrySnapshot) -> None:
        """Replace the full snapshot (e.g. live Java telemetry poll)."""
        with self._lock:
            self._snapshot = snapshot.model_copy(deep=True)


telemetry_service = TelemetryService()
