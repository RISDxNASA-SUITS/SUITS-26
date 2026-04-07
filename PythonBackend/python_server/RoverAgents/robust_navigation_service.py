from typing import Dict
import os

import requests

from .RobustNavigator import RobustNavigator


robust_navigator = RobustNavigator()


def _try_autostart_rover_sim() -> bool:
    tss_url = os.getenv("TSS_HTTP_URL", "http://localhost:14141/")
    try:
        requests.post(
            tss_url,
            data="rover.pr_telemetry.sim_running=true",
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=1.0,
        )
    except requests.RequestException:
        return False
    return True


def start_robust_navigation(x: float, y: float) -> Dict[str, object]:
    auto_started = _try_autostart_rover_sim()
    started = robust_navigator.start_navigation(float(x), float(y))
    if not started:
        return {"success": False, "error": "Robust navigation already in progress"}
    result = {"success": True, "message": "Robust navigation started", "goal": [float(x), float(y)]}
    if auto_started:
        result["warning"] = "Simulator auto-start command was sent before navigation"
    return result


def get_robust_navigation_state() -> Dict[str, object]:
    return robust_navigator.get_navigation_state()


def cancel_robust_navigation() -> Dict[str, object]:
    robust_navigator.cancel_navigation()
    return {"success": True, "message": "Robust navigation cancelled"}
