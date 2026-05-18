"""HTTP client for EVA/rover/LTV telemetry from the Java backend."""

from __future__ import annotations

from typing import Any

import httpx

from app.core.config import settings


class JavaTelemetryError(Exception):
    """Raised when a Java backend telemetry request fails."""


class JavaTelemetryClient:
    def __init__(
        self,
        base_url: str | None = None,
        timeout_s: float | None = None,
    ) -> None:
        self.base_url = (base_url or settings.java_backend_url).rstrip("/")
        self.timeout_s = timeout_s if timeout_s is not None else settings.java_http_timeout_s

    def _get_json(self, path: str) -> dict[str, Any]:
        url = f"{self.base_url}{path}"
        try:
            with httpx.Client(timeout=self.timeout_s) as client:
                response = client.get(url)
                response.raise_for_status()
                data = response.json()
        except (httpx.HTTPError, ValueError) as exc:
            raise JavaTelemetryError(f"GET {path} failed: {exc}") from exc
        if not isinstance(data, dict):
            raise JavaTelemetryError(f"GET {path} returned non-object JSON")
        return data

    def fetch_ev1_telemetry(self) -> dict[str, Any]:
        return self._get_json("/ev-telemetry/1")

    def fetch_dcu1(self) -> dict[str, Any]:
        return self._get_json("/dcu/1")

    def fetch_errors(self) -> dict[str, Any]:
        return self._get_json("/error")

    def fetch_rover_telemetry(self) -> dict[str, Any]:
        return self._get_json("/telemetry")

    def fetch_ltv(self) -> dict[str, Any]:
        return self._get_json("/ltv")

    def fetch_ltv_errors(self) -> dict[str, Any]:
        return self._get_json("/ltv-errors")


def fetch_live_telemetry_bundle(client: JavaTelemetryClient | None = None) -> dict[str, Any]:
    """Fetch all Java payloads needed to build a TelemetrySnapshot."""
    c = client or JavaTelemetryClient()
    return {
        "ev1": c.fetch_ev1_telemetry(),
        "dcu": c.fetch_dcu1(),
        "errors": c.fetch_errors(),
        "rover": c.fetch_rover_telemetry(),
        "ltv": c.fetch_ltv(),
        "ltv_errors": c.fetch_ltv_errors(),
    }
