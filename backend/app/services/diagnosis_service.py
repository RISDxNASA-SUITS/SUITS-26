"""
Deterministic diagnosis stubs for LTV_REPAIR (no sensors, no LLM).
"""

def diagnosis_line(ltv_status: str) -> str:
    """Map mock LTV status string to a single concise diagnosis line."""
    s = ltv_status.strip().lower()
    if not s:
        return "Diagnosis complete. Insufficient LTV status label."

    if "nav" in s or s in ("fault", "fault_nav", "navigation_fault"):
        return "Diagnosis complete. Navigation restart required."

    if "dust" in s or "sensor" in s:
        return "Diagnosis complete. Dust sensor repair is optional."

    if s in ("idle", "nominal", "ok"):
        return "Diagnosis complete. No mandatory corrective action. Verify before EVA."

    return "Diagnosis complete. Review LTV subsystem per maintenance card."
