from typing import Optional

from pydantic import BaseModel, Field


class TelemetrySnapshot(BaseModel):
    """Full EVA telemetry snapshot (in-memory mock)."""

    primary_o2_pct: float = Field(..., ge=0, le=100, description="Primary suit O₂ bottle / primary path %")
    secondary_o2_pct: float = Field(..., ge=0, le=100, description="Secondary O₂ %")
    battery_pct: float = Field(..., ge=0, le=100, description="Battery state of charge %")
    co2_status: str = Field(..., description="CO₂ scrubber / CO₂ qualitative status")
    comms_status: str = Field(..., description="Comms link status")
    safe_range_m: float = Field(..., ge=0, description="Distance to safe zone / waypoint (meters)")
    ltv_status: str = Field(..., description="Lunar Terrain Vehicle status label")


class TelemetryUpdate(BaseModel):
    """Partial update for POST /telemetry/update — omitted fields unchanged."""

    primary_o2_pct: Optional[float] = Field(None, ge=0, le=100)
    secondary_o2_pct: Optional[float] = Field(None, ge=0, le=100)
    battery_pct: Optional[float] = Field(None, ge=0, le=100)
    co2_status: Optional[str] = Field(None, min_length=1, max_length=64)
    comms_status: Optional[str] = Field(None, min_length=1, max_length=64)
    safe_range_m: Optional[float] = Field(None, ge=0)
    ltv_status: Optional[str] = Field(None, min_length=1, max_length=64)
