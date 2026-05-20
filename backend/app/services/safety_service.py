"""
Guardrails: validate parsed commands before execution. Deterministic, no LLM.
"""

from dataclasses import dataclass
from typing import Optional

from app.models.mission import MissionPhase
from app.models.parse_result import ParseResult
from app.services.mission_service import mission_service
from app.services.procedure_service import ENTITY_TO_PROCEDURE_ID, procedure_service
from app.services.telemetry_service import telemetry_service


@dataclass(frozen=True)
class GuardrailResult:
    ok: bool
    error_code: Optional[str] = None
    message: Optional[str] = None


def evaluate(parsed: ParseResult) -> GuardrailResult:
    """
    Run all guardrails. When ok is False, command execution must be skipped.
    """
    intent = parsed.intent
    entity = parsed.entity
    phase = mission_service.get_phase()

    if intent == "unknown":
        return GuardrailResult(
            ok=False,
            error_code="UNKNOWN_COMMAND",
            message=(
                "Command not recognized. Say 'help' for supported phrases, "
                "or use mission vocabulary from the training list."
            ),
        )

    if intent == "diagnosis_request":
        if phase != MissionPhase.LTV_REPAIR:
            return GuardrailResult(
                ok=False,
                error_code="DIAGNOSIS_PHASE_DENIED",
                message="Diagnosis is only allowed during LTV_REPAIR phase.",
            )

    if intent in ("status_query", "warning_check"):
        if not telemetry_service.is_available():
            subj = _status_subject(entity) if intent == "status_query" else "warnings"
            return GuardrailResult(
                ok=False,
                error_code="TELEMETRY_UNAVAILABLE",
                message=(
                    f"Telemetry unavailable. Unable to confirm {subj}."
                    if intent == "status_query"
                    else "Telemetry unavailable. Unable to evaluate warnings."
                ),
            )

    if phase == MissionPhase.COMPLETE and intent in (
        "procedure_start",
        "procedure_next",
        "procedure_repeat",
    ):
        return GuardrailResult(
            ok=False,
            error_code="COMMAND_PHASE_DENIED",
            message="Procedure commands are not allowed in COMPLETE phase.",
        )

    if intent in ("procedure_next", "procedure_repeat"):
        st = procedure_service.get_current_state()
        if not st.active:
            return GuardrailResult(
                ok=False,
                error_code="NO_ACTIVE_PROCEDURE",
                message="No active procedure. Unable to advance.",
            )

    if intent == "procedure_start":
        if not entity or entity not in ENTITY_TO_PROCEDURE_ID:
            return GuardrailResult(
                ok=False,
                error_code="INVALID_PROCEDURE_TARGET",
                message="Unknown procedure target. Say: start egress, start erm, start repair, or start ingress.",
            )
        proc_id = ENTITY_TO_PROCEDURE_ID[entity]
        definition = procedure_service.get_definition(proc_id)
        if not definition:
            return GuardrailResult(
                ok=False,
                error_code="PROCEDURE_NOT_LOADED",
                message=f"Procedure {proc_id} is not available.",
            )
        if phase != definition.allowed_phase:
            return GuardrailResult(
                ok=False,
                error_code="PROCEDURE_NOT_ALLOWED_IN_PHASE",
                message=(
                    f"Procedure {proc_id} is not allowed in current phase {phase.value}. "
                    f"Required phase: {definition.allowed_phase.value}."
                ),
            )

    return GuardrailResult(ok=True)


def _status_subject(entity: Optional[str]) -> str:
    if entity == "oxygen":
        return "oxygen"
    if entity == "battery":
        return "battery"
    if entity == "co2":
        return "CO₂"
    return "requested"
