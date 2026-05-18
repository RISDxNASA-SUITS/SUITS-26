from app.models.mission import MissionPhase
from app.services.mission_service import MissionService


def test_get_initial_phase():
    svc = MissionService(initial_phase=MissionPhase.INIT)
    assert svc.get_phase() == MissionPhase.INIT


def test_set_phase_roundtrip():
    svc = MissionService(initial_phase=MissionPhase.INIT)
    out = svc.set_phase(MissionPhase.EGRESS)
    assert out == MissionPhase.EGRESS
    assert svc.get_phase() == MissionPhase.EGRESS


def test_set_all_phases():
    svc = MissionService(initial_phase=MissionPhase.INIT)
    for p in MissionPhase:
        svc.set_phase(p)
        assert svc.get_phase() == p
