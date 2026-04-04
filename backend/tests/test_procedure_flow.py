"""Procedure engine: phase checks, next, repeat, complete."""

import pytest

from app.models.mission import MissionPhase
from app.services.mission_service import mission_service
from app.services.procedure_service import (
    ProcedureNotActiveError,
    ProcedurePhaseError,
    ProcedureService,
)


@pytest.fixture()
def svc():
    return ProcedureService()


def test_start_rejects_wrong_phase(svc: ProcedureService):
    mission_service.set_phase(MissionPhase.INIT)
    with pytest.raises(ProcedurePhaseError):
        svc.start("EGRESS_UIA", mission_service.get_phase())


def test_start_accepts_matching_phase(svc: ProcedureService):
    mission_service.set_phase(MissionPhase.EGRESS)
    msg, state = svc.start("EGRESS_UIA", mission_service.get_phase())
    assert "Started" in msg
    assert state.active is True
    assert state.procedure_id == "EGRESS_UIA"
    assert state.step_index == 0
    assert state.instruction


def test_next_advances(svc: ProcedureService):
    mission_service.set_phase(MissionPhase.EGRESS)
    svc.start("EGRESS_UIA", mission_service.get_phase())
    msg, state = svc.next_step()
    assert state.active is True
    assert state.step_index == 1
    assert "Advanced" in msg


def test_repeat_keeps_index(svc: ProcedureService):
    mission_service.set_phase(MissionPhase.EGRESS)
    svc.start("EGRESS_UIA", mission_service.get_phase())
    svc.next_step()
    _, a = svc.repeat_step()
    _, b = svc.repeat_step()
    assert a.step_index == b.step_index == 1


def test_next_on_last_step_completes(svc: ProcedureService):
    mission_service.set_phase(MissionPhase.EGRESS)
    svc.start("EGRESS_UIA", mission_service.get_phase())
    proc = svc.get_definition("EGRESS_UIA")
    assert proc is not None
    for _ in range(len(proc.steps) - 1):
        svc.next_step()
    msg, state = svc.next_step()
    assert "complete" in msg.lower() or "Complete" in msg
    assert state.active is False


def test_next_without_active_raises(svc: ProcedureService):
    with pytest.raises(ProcedureNotActiveError):
        svc.next_step()
