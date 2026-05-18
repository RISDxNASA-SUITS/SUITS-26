from copy import deepcopy
from threading import Lock

from app.core.config import settings
from app.core.telemetry_fixtures import initial_bundle, training_bundle
from app.models.live_telemetry import LiveTelemetryBundle
from app.models.telemetry import TelemetrySnapshot, TelemetryUpdate
from app.services.java_telemetry_mapper import build_snapshot


class TelemetryService:
    """In-memory telemetry store with thread-safe read/update."""

    def __init__(self) -> None:
        self._lock = Lock()
        self._available: bool = True
        bundle = training_bundle() if settings.live_telemetry_enabled else initial_bundle()
        self._bundle: LiveTelemetryBundle = bundle.model_copy(deep=True)
        self._snapshot = build_snapshot(self._bundle)

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

    def get_bundle(self) -> LiveTelemetryBundle | None:
        with self._lock:
            if self._bundle is None:
                return None
            return self._bundle.model_copy(deep=True)

    def update(self, patch: TelemetryUpdate) -> TelemetrySnapshot:
        """Apply partial update to summary only (mock mode). Bundle ev1 is not synced."""
        data = patch.model_dump(exclude_unset=True)
        with self._lock:
            current = self._snapshot.model_dump()
            current.update(data)
            self._snapshot = TelemetrySnapshot.model_validate(current)
            return deepcopy(self._snapshot)

    def seed_training(self) -> None:
        """Reset to training bundle and snapshot (tests). Independent of demo_mode."""
        with self._lock:
            self._available = True
            self._bundle = training_bundle().model_copy(deep=True)
            self._snapshot = build_snapshot(self._bundle)
        from app.services.warning_edge_service import reset_warning_edge_for_tests

        reset_warning_edge_for_tests()

    def reset_to_defaults(self) -> None:
        """Restore startup defaults (respects EVA_DEMO_MODE)."""
        with self._lock:
            self._available = True
            self._bundle = initial_bundle().model_copy(deep=True)
            self._snapshot = build_snapshot(self._bundle)

    def replace_bundle(self, bundle: LiveTelemetryBundle) -> None:
        """Replace full Java telemetry bundle and derive summary snapshot."""
        with self._lock:
            self._bundle = bundle.model_copy(deep=True)
            self._snapshot = build_snapshot(self._bundle)

    def replace_snapshot(self, snapshot: TelemetrySnapshot) -> None:
        """Replace summary only (legacy); prefer replace_bundle for live polls."""
        with self._lock:
            self._snapshot = snapshot.model_copy(deep=True)


telemetry_service = TelemetryService()
