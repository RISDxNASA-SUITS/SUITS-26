from app.models.parse_result import ParseResult
from app.services.mission_service import mission_service
from app.services.procedure_service import ENTITY_TO_PROCEDURE_ID, procedure_service
from app.services.response_generation import (
    diagnosis_stub,
    status_battery,
    status_co2,
    status_oxygen,
    warning_check_summary,
)
from app.services.telemetry_service import telemetry_service


def execute_command_response(parsed: ParseResult) -> str:
    """Execute business logic after guardrails pass. Does not re-check safety."""
    intent = parsed.intent
    entity = parsed.entity

    if intent == "status_query":
        snap = telemetry_service.get_snapshot()
        if entity == "oxygen":
            return status_oxygen(snap)
        if entity == "battery":
            return status_battery(snap)
        if entity == "co2":
            return status_co2(snap)
        return "Status target missing."

    if intent == "mission_phase_check":
        phase = mission_service.get_phase()
        return f"Phase: {phase.value}."

    if intent == "help":
        return (
            "Status: oxygen | battery | co2. Procedures: start egress | erm | repair | ingress. "
            "Steps: next | repeat. Safety: any warnings, run diagnosis (LTV_REPAIR), return route (EVA_NAV/INGRESS). "
            "Set mission phase before starting procedures."
        )

    if intent == "procedure_start":
        proc_id = ENTITY_TO_PROCEDURE_ID[entity or ""]
        msg, _state = procedure_service.start(proc_id, mission_service.get_phase())
        return msg

    if intent == "procedure_next":
        msg, _state = procedure_service.next_step()
        return msg

    if intent == "procedure_repeat":
        msg, _state = procedure_service.repeat_step()
        return msg

    if intent == "navigation_return":
        snap = telemetry_service.get_snapshot()
        return (
            f"Return: vector toward airlock; safe-range ref {snap.safe_range_m:.1f} m. "
            "Confirm route with capcom if unsure."
        )

    if intent == "diagnosis_request":
        snap = telemetry_service.get_snapshot()
        return diagnosis_stub(snap.ltv_status)

    if intent == "warning_check":
        snap = telemetry_service.get_snapshot()
        return warning_check_summary(snap)

    return f"Unhandled intent: {intent}."
