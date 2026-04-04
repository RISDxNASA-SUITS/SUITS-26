import pytest

from app.services.diagnosis_service import diagnosis_line


@pytest.mark.parametrize(
    ("ltv", "snippet"),
    [
        ("fault_nav", "Navigation restart"),
        ("dust_sensor_fault", "Dust sensor repair"),
        ("idle", "No mandatory corrective"),
    ],
)
def test_diagnosis_lines(ltv, snippet):
    assert snippet in diagnosis_line(ltv)


def test_default_bucket():
    assert "Review LTV" in diagnosis_line("unknown_state")
