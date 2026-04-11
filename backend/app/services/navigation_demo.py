"""Demo navigation hook — no real routing; logs intent for offline demos."""


def navigate(input_location: str) -> str:
    loc = (input_location or "").strip() or "unspecified waypoint"
    return f"Demo Navigate: routing to {loc}. (No live navigation in this build.)"
