"""Tracks whether the latest Java telemetry poll succeeded."""

from threading import Lock


class LiveTelemetryState:
    def __init__(self) -> None:
        self._lock = Lock()
        self._ok = False

    def set_ok(self, ok: bool) -> None:
        with self._lock:
            self._ok = ok

    def is_ok(self) -> bool:
        with self._lock:
            return self._ok


live_telemetry_state = LiveTelemetryState()
