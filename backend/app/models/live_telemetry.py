"""Full Java mission telemetry bundle (raw JSON per endpoint)."""

from typing import Any

from pydantic import BaseModel, Field


class LiveTelemetryBundle(BaseModel):
    """Canonical store for all polled Java mission telemetry."""

    ev1: dict[str, Any] = Field(default_factory=dict)
    ev2: dict[str, Any] = Field(default_factory=dict)
    dcu1: dict[str, Any] = Field(default_factory=dict)
    dcu2: dict[str, Any] = Field(default_factory=dict)
    errors: dict[str, Any] = Field(default_factory=dict)
    imu1: dict[str, Any] = Field(default_factory=dict)
    imu2: dict[str, Any] = Field(default_factory=dict)
    uia: dict[str, Any] = Field(default_factory=dict)
    eva_states: dict[str, Any] = Field(default_factory=dict)
    rover: dict[str, Any] = Field(default_factory=dict)
    lidar: dict[str, Any] = Field(default_factory=dict)
    ltv: dict[str, Any] = Field(default_factory=dict)
    ltv_errors: dict[str, Any] = Field(default_factory=dict)
    polled_at_unix: float = Field(..., description="Unix time when bundle was assembled")
