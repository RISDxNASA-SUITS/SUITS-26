"""HTTP client for EVA/rover/LTV telemetry from the Java backend."""

from __future__ import annotations

import time
from typing import Any

import httpx

from app.core.config import settings
from app.models.live_telemetry import LiveTelemetryBundle


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

    def _get_json(self, client: httpx.Client, path: str) -> dict[str, Any]:
        url = f"{self.base_url}{path}"
        try:
            response = client.get(url)
            response.raise_for_status()
            data = response.json()
        except (httpx.HTTPError, ValueError) as exc:
            raise JavaTelemetryError(f"GET {path} failed: {exc}") from exc
        if not isinstance(data, dict):
            raise JavaTelemetryError(f"GET {path} returned non-object JSON")
        return data

    def fetch_ev1_telemetry(self, client: httpx.Client) -> dict[str, Any]:
        return self._get_json(client, "/ev-telemetry/1")

    def fetch_ev2_telemetry(self, client: httpx.Client) -> dict[str, Any]:
        return self._get_json(client, "/ev-telemetry/2")

    def fetch_dcu1(self, client: httpx.Client) -> dict[str, Any]:
        return self._get_json(client, "/dcu/1")

    def fetch_dcu2(self, client: httpx.Client) -> dict[str, Any]:
        return self._get_json(client, "/dcu/2")

    def fetch_errors(self, client: httpx.Client) -> dict[str, Any]:
        return self._get_json(client, "/error")

    def fetch_imu1(self, client: httpx.Client) -> dict[str, Any]:
        return self._get_json(client, "/imu/1")

    def fetch_imu2(self, client: httpx.Client) -> dict[str, Any]:
        return self._get_json(client, "/imu/2")

    def fetch_uia(self, client: httpx.Client) -> dict[str, Any]:
        return self._get_json(client, "/uia")

    def fetch_eva_states(self, client: httpx.Client) -> dict[str, Any]:
        return self._get_json(client, "/evaStates")

    def fetch_rover_telemetry(self, client: httpx.Client) -> dict[str, Any]:
        return self._get_json(client, "/telemetry")

    def fetch_lidar(self, client: httpx.Client) -> dict[str, Any]:
        return self._get_json(client, "/lidar")

    def fetch_ltv(self, client: httpx.Client) -> dict[str, Any]:
        return self._get_json(client, "/ltv")

    def fetch_ltv_errors(self, client: httpx.Client) -> dict[str, Any]:
        return self._get_json(client, "/ltv-errors")


def fetch_live_telemetry_bundle(client: JavaTelemetryClient | None = None) -> LiveTelemetryBundle:
    """Fetch all Java mission telemetry payloads."""
    c = client or JavaTelemetryClient()
    polled_at = time.time()
    try:
        with httpx.Client(timeout=c.timeout_s) as http:
            return LiveTelemetryBundle(
                ev1=c.fetch_ev1_telemetry(http),
                ev2=c.fetch_ev2_telemetry(http),
                dcu1=c.fetch_dcu1(http),
                dcu2=c.fetch_dcu2(http),
                errors=c.fetch_errors(http),
                imu1=c.fetch_imu1(http),
                imu2=c.fetch_imu2(http),
                uia=c.fetch_uia(http),
                eva_states=c.fetch_eva_states(http),
                rover=c.fetch_rover_telemetry(http),
                lidar=c.fetch_lidar(http),
                ltv=c.fetch_ltv(http),
                ltv_errors=c.fetch_ltv_errors(http),
                polled_at_unix=polled_at,
            )
    except JavaTelemetryError:
        raise
    except httpx.HTTPError as exc:
        raise JavaTelemetryError(f"Java telemetry fetch failed: {exc}") from exc
