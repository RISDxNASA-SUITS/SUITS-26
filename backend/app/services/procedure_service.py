"""
YAML-backed procedure engine: load definitions, start/next/repeat with phase checks.
"""

from __future__ import annotations

import logging
from pathlib import Path
from threading import Lock
from typing import Optional

import yaml
from pydantic import ValidationError

from app.models.mission import MissionPhase
from app.models.procedure import (
    ProcedureCurrentState,
    ProcedureDefinition,
    ProcedureSummary,
)

logger = logging.getLogger(__name__)

# Command parser entities -> procedure_id
ENTITY_TO_PROCEDURE_ID: dict[str, str] = {
    "egress": "EGRESS_UIA",
    "erm": "ERM_REPAIR",
    "repair": "ERM_REPAIR",
    "ingress": "INGRESS_RETURN",
}


def _default_procedures_dir() -> Path:
    # backend/app/services/procedure_service.py -> parents[2] == backend/
    return Path(__file__).resolve().parents[2] / "data" / "procedures"


class ProcedurePhaseError(Exception):
    """Raised when mission phase does not match procedure allowed_phase."""

    def __init__(self, message: str) -> None:
        self.message = message
        super().__init__(message)


class ProcedureNotActiveError(Exception):
    """No procedure running."""

    def __init__(self, message: str = "No active procedure.") -> None:
        self.message = message
        super().__init__(message)


class ProcedureUnknownError(Exception):
    """Unknown procedure_id."""

    def __init__(self, procedure_id: str) -> None:
        self.procedure_id = procedure_id
        super().__init__(f"Unknown procedure: {procedure_id}")


class ProcedureService:
    def __init__(self, procedures_dir: Optional[Path] = None) -> None:
        self._dir = procedures_dir or _default_procedures_dir()
        self._lock = Lock()
        self._definitions: dict[str, ProcedureDefinition] = {}
        self._active_id: Optional[str] = None
        self._step_index: int = 0
        self.reload()

    def reload(self) -> None:
        """Load or reload all *.yaml from procedures directory."""
        definitions: dict[str, ProcedureDefinition] = {}
        if not self._dir.is_dir():
            logger.warning("Procedures directory missing: %s", self._dir)
            with self._lock:
                self._definitions = definitions
            return

        for path in sorted(self._dir.glob("*.yaml")):
            try:
                raw = yaml.safe_load(path.read_text(encoding="utf-8"))
                if not raw:
                    continue
                proc = ProcedureDefinition.model_validate(raw)
                if proc.procedure_id in definitions:
                    logger.warning("Duplicate procedure_id %s in %s", proc.procedure_id, path)
                definitions[proc.procedure_id] = proc
            except (ValidationError, yaml.YAMLError, OSError) as e:
                logger.error("Failed to load procedure from %s: %s", path, e)
                raise

        with self._lock:
            self._definitions = definitions

    def list_procedures(self) -> list[ProcedureSummary]:
        with self._lock:
            return [
                ProcedureSummary(
                    procedure_id=p.procedure_id,
                    title=p.title,
                    allowed_phase=p.allowed_phase,
                )
                for p in sorted(self._definitions.values(), key=lambda x: x.procedure_id)
            ]

    def get_definition(self, procedure_id: str) -> Optional[ProcedureDefinition]:
        with self._lock:
            return self._definitions.get(procedure_id)

    def _build_state_locked(self) -> ProcedureCurrentState:
        if not self._active_id or self._active_id not in self._definitions:
            return ProcedureCurrentState(active=False)

        proc = self._definitions[self._active_id]
        if self._step_index < 0 or self._step_index >= len(proc.steps):
            return ProcedureCurrentState(active=False)

        step = proc.steps[self._step_index]
        return ProcedureCurrentState(
            active=True,
            procedure_id=proc.procedure_id,
            title=proc.title,
            allowed_phase=proc.allowed_phase,
            step_index=self._step_index,
            step_count=len(proc.steps),
            current_step_id=step.step_id,
            instruction=step.instruction,
            check_key=step.check_key,
        )

    def get_current_state(self) -> ProcedureCurrentState:
        with self._lock:
            return self._build_state_locked()

    def start(self, procedure_id: str, mission_phase: MissionPhase) -> tuple[str, ProcedureCurrentState]:
        """Start procedure if phase matches. Returns (message, state)."""
        with self._lock:
            proc = self._definitions.get(procedure_id)
            if not proc:
                raise ProcedureUnknownError(procedure_id)
            if mission_phase != proc.allowed_phase:
                raise ProcedurePhaseError(
                    f"Procedure {procedure_id} requires phase {proc.allowed_phase.value}; "
                    f"current phase is {mission_phase.value}."
                )
            self._active_id = procedure_id
            self._step_index = 0
            state = self._build_state_locked()
            msg = f"Started {proc.title} ({procedure_id}). Step {self._step_index + 1}/{len(proc.steps)}."
            return msg, state

    def next_step(self) -> tuple[str, ProcedureCurrentState]:
        with self._lock:
            if not self._active_id or self._active_id not in self._definitions:
                raise ProcedureNotActiveError()
            proc = self._definitions[self._active_id]
            if self._step_index >= len(proc.steps) - 1:
                self._active_id = None
                self._step_index = 0
                return "Procedure complete. No active procedure.", ProcedureCurrentState(active=False)
            self._step_index += 1
            state = self._build_state_locked()
            msg = f"Advanced to step {self._step_index + 1}/{len(proc.steps)}: {state.instruction}"
            return msg, state

    def repeat_step(self) -> tuple[str, ProcedureCurrentState]:
        with self._lock:
            if not self._active_id or self._active_id not in self._definitions:
                raise ProcedureNotActiveError()
            proc = self._definitions[self._active_id]
            state = self._build_state_locked()
            msg = f"Repeat step {self._step_index + 1}/{len(proc.steps)}: {state.instruction}"
            return msg, state

    def reset_idle(self) -> None:
        """Clear active procedure (for tests)."""
        with self._lock:
            self._active_id = None
            self._step_index = 0


procedure_service = ProcedureService()
