"""YAML procedure definitions load and validate."""

from app.services.procedure_service import ProcedureService, _default_procedures_dir


def test_default_dir_contains_yaml():
    d = _default_procedures_dir()
    assert d.is_dir()
    assert list(d.glob("*.yaml"))


def test_procedure_service_loads_three_procedures():
    svc = ProcedureService()
    ids = {p.procedure_id for p in svc.list_procedures()}
    assert ids == {"EGRESS_UIA", "ERM_REPAIR", "INGRESS_RETURN"}


def test_egress_definition_shape():
    svc = ProcedureService()
    d = svc.get_definition("EGRESS_UIA")
    assert d is not None
    assert d.title
    assert d.allowed_phase.value == "EGRESS"
    assert len(d.steps) >= 1
    assert d.steps[0].step_id
    assert d.steps[0].instruction


def test_step_optional_check_key():
    svc = ProcedureService()
    d = svc.get_definition("INGRESS_RETURN")
    assert d is not None
    # IR3 has no check_key in YAML
    last = d.steps[-1]
    assert last.check_key is None
