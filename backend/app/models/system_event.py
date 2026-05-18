from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

SystemEventLevel = Literal["alert", "warning", "error", "unexpected"]


class SystemEventItem(BaseModel):
    id: int
    timestamp_unix: float
    level: SystemEventLevel
    message: str
    codes: list[str] = Field(default_factory=list)
    source: str | None = None
