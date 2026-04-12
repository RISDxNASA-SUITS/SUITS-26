"""Robust state-machine rover navigator built on lidar and telemetry feedback.

The navigator runs in a background thread, polls telemetry and lidar, and
publishes a compact state snapshot for the Flask API. Its control flow is:

1. steer directly toward the goal when space is clear,
2. bias away from nearby obstacles when caution zones are hit,
3. detect pinned or stalled conditions when commands are not producing motion,
4. recover by reversing and then forcing a turn before resuming goal-seeking.
"""

import threading
import time
from dataclasses import dataclass
from enum import Enum
from typing import Dict, List, Optional

from .helper_functions import (
    LidarSummary,
    clamp,
    compute_goal_relative_heading_deg,
    euclidean_distance,
    normalize_lidar,
    summarize_lidar,
)
from .rover_client import get_lidar, get_telemetry, post_brakes, post_steering, post_throttle


class Phase(str, Enum):
    """High-level controller phases used by the robust navigator.

    `SEEK` is normal goal-tracking, `AVOID` is forward motion with obstacle bias,
    `RECOVER_REVERSE` and `RECOVER_TURN` are the two recovery stages, `HOLD`
    means the rover is intentionally stopped because no safe move is available.
    """
    IDLE = "IDLE"
    SEEK = "SEEK"
    AVOID = "AVOID"
    RECOVER_REVERSE = "RECOVER_REVERSE"
    RECOVER_TURN = "RECOVER_TURN"
    HOLD = "HOLD"
    COMPLETE = "COMPLETE"
    FAILED = "FAILED"


@dataclass(frozen=True)
class NavConfig:
    """Tunable thresholds and timings for robust navigation behavior.

    These values control when the rover treats lidar returns as caution or hard
    stops, how much reverse/turn time to use during recovery, and how long it
    waits before deciding that commanded motion is not producing progress.
    """
    goal_tolerance_m: float = 5.0
    control_period_s: float = 0.12
    min_command_hold_s: float = 0.6
    throttle_deadband: float = 2.0
    steering_deadband: float = 0.10
    throttle_fast: float = 18.0
    throttle_crawl: float = 9.0
    throttle_reverse: float = -16.0
    steering_limit: float = 1.0
    hard_stop_cm: float = 130.0
    caution_front_cm: float = 300.0
    sharp_turn_front_cm: float = 260.0
    side_caution_cm: float = 230.0
    rear_safe_cm: float = 220.0
    default_lidar_cm: float = 1500.0
    progress_window_s: float = 4.0
    progress_min_distance_m: float = 0.2
    moving_speed_threshold_mps: float = 0.15
    blocked_speed_threshold_mps: float = 0.05
    blocked_detection_s: float = 0.8
    reverse_duration_s: float = 1.8
    turn_duration_s: float = 1.4
    max_sensor_failures: int = 8


class RobustNavigator:
    """Drive the rover toward a goal while reacting to obstacles and stalls.

    This class owns three concerns:
    - background execution and cancellation,
    - public navigation state for API/debug views,
    - phase-based command selection from goal direction, lidar, and speed.
    """
    def __init__(self) -> None:
        self.config = NavConfig()

        self._thread: Optional[threading.Thread] = None
        self._stop_event = threading.Event()
        self._state_lock = threading.Lock()

        self._phase = Phase.IDLE
        self._phase_until = 0.0
        self._avoid_side = "none"
        self._recoveries = 0
        self._sensor_failures = 0
        self._last_progress_position: Optional[List[float]] = None
        self._last_progress_time = time.monotonic()
        self._blocked_since: Optional[float] = None
        self._last_command_time = 0.0
        self._last_sent_throttle = 0.0
        self._last_sent_steering = 0.0
        self._last_sent_brakes = False

        self.navigation_state = {
            "status": "idle",
            "start": None,
            "goal": None,
            "path": [],
            "message": "",
            "phase": self._phase.value,
            "recoveries": 0,
            "avoid_side": self._avoid_side,
            "distance_to_goal": None,
        }

    def start_navigation(self, goal_x: float, goal_y: float) -> bool:
        """Start a background navigation thread if one is not already running."""
        with self._state_lock:
            if self._thread and self._thread.is_alive():
                return False
            self._stop_event.clear()

            def _run() -> None:
                try:
                    self.follow_path([float(goal_x), float(goal_y)])
                except Exception as exc:
                    self._stop_motion(brakes=True)
                    self._finish_navigation(False, f"Navigation error: {exc}")

            self._thread = threading.Thread(target=_run, daemon=True)
            self._thread.start()
            return True

    def cancel_navigation(self) -> None:
        """Stop the current navigation thread and command the rover to halt."""
        self._stop_event.set()
        self._stop_motion(brakes=True)
        self._finish_navigation(False, "Cancelled")
        thread = self._thread
        if thread and thread.is_alive():
            thread.join(timeout=2.0)

    def get_navigation_state(self) -> Dict[str, object]:
        """Return a copy of the externally visible navigation state."""
        with self._state_lock:
            return {
                "status": self.navigation_state["status"],
                "start": list(self.navigation_state["start"]) if self.navigation_state["start"] else None,
                "goal": list(self.navigation_state["goal"]) if self.navigation_state["goal"] else None,
                "path": [list(point) for point in self.navigation_state["path"]],
                "message": self.navigation_state["message"],
                "phase": self.navigation_state["phase"],
                "recoveries": self.navigation_state["recoveries"],
                "avoid_side": self.navigation_state["avoid_side"],
                "distance_to_goal": self.navigation_state["distance_to_goal"],
            }

    def follow_path(self, goal: List[float]) -> bool:
        """Run the navigation loop until the goal is reached or navigation stops.

        Each loop iteration fetches telemetry and lidar, updates the recorded
        path, computes a goal-relative steering value, then lets
        `_compute_command` decide whether to seek, avoid, hold, or recover.
        """
        self._begin_navigation(goal)

        while not self._stop_event.is_set():
            telemetry = get_telemetry()
            lidar_payload = get_lidar()

            if telemetry is None or lidar_payload is None:
                self._sensor_failures += 1
                self._stop_motion(brakes=False)
                self._set_message(f"Waiting for telemetry/lidar ({self._sensor_failures})")
                if self._sensor_failures >= self.config.max_sensor_failures:
                    self._finish_navigation(False, "Telemetry/lidar unavailable")
                    return False
                time.sleep(self.config.control_period_s)
                continue

            self._sensor_failures = 0
            position = [
                float(telemetry["currentPosX"]),
                float(telemetry["currentPosY"]),
            ]
            heading_deg = float(telemetry["heading"])
            speed = float(telemetry.get("speed", 0.0))

            self._record_position(position)
            distance_to_goal = euclidean_distance(position, goal)
            self._set_distance(distance_to_goal)

            if distance_to_goal <= self.config.goal_tolerance_m:
                self._stop_motion(brakes=True)
                self._finish_navigation(True, "Reached goal")
                return True

            lidar = normalize_lidar(lidar_payload.get("data", []), self.config.default_lidar_cm)
            summary = summarize_lidar(lidar, self.config.default_lidar_cm)
            now = time.monotonic()
            goal_steer = self._goal_steer(position, goal, heading_deg)

            throttle, steering, brakes = self._compute_command(
                goal_steer=goal_steer,
                lidar=summary,
                speed=speed,
                now=now,
            )
            self._command(throttle, steering, brakes)
            time.sleep(self.config.control_period_s)

        self._stop_motion(brakes=True)
        self._finish_navigation(False, "Cancelled")
        return False

    def _begin_navigation(self, goal: List[float]) -> None:
        """Reset controller state for a newly requested goal."""
        self._phase = Phase.SEEK
        self._phase_until = 0.0
        self._avoid_side = "none"
        self._recoveries = 0
        self._sensor_failures = 0
        self._last_progress_position = None
        self._last_progress_time = time.monotonic()
        self._blocked_since = None
        self._last_command_time = 0.0
        self._last_sent_throttle = 0.0
        self._last_sent_steering = 0.0
        self._last_sent_brakes = False

        with self._state_lock:
            self.navigation_state = {
                "status": "navigating",
                "start": None,
                "goal": [float(goal[0]), float(goal[1])],
                "path": [],
                "message": "Starting navigation",
                "phase": self._phase.value,
                "recoveries": 0,
                "avoid_side": self._avoid_side,
                "distance_to_goal": None,
            }

    def _finish_navigation(self, success: bool, message: str) -> None:
        """Mark navigation as complete or failed and publish the final message."""
        self._phase = Phase.COMPLETE if success else Phase.FAILED
        with self._state_lock:
            self.navigation_state["status"] = "completed" if success else "failed"
            self.navigation_state["message"] = message
            self.navigation_state["phase"] = self._phase.value
            self.navigation_state["recoveries"] = self._recoveries
            self.navigation_state["avoid_side"] = self._avoid_side

    def _set_message(self, message: str) -> None:
        """Update the human-readable status message exposed by the API."""
        with self._state_lock:
            self.navigation_state["message"] = message
            self.navigation_state["phase"] = self._phase.value
            self.navigation_state["recoveries"] = self._recoveries
            self.navigation_state["avoid_side"] = self._avoid_side

    def _set_distance(self, distance_to_goal: float) -> None:
        """Update the reported remaining distance to the active goal."""
        with self._state_lock:
            self.navigation_state["distance_to_goal"] = float(distance_to_goal)

    def _record_position(self, position: List[float]) -> None:
        """Append a new rover position to the recorded path and progress tracker."""
        point = [float(position[0]), float(position[1])]
        with self._state_lock:
            if self.navigation_state["start"] is None:
                self.navigation_state["start"] = point
            path = self.navigation_state["path"]
            if not path or path[-1] != point:
                path.append(point)

        if self._last_progress_position is None:
            self._last_progress_position = point
            self._last_progress_time = time.monotonic()
            return

        if euclidean_distance(point, self._last_progress_position) >= self.config.progress_min_distance_m:
            self._last_progress_position = point
            self._last_progress_time = time.monotonic()

    def _compute_command(
        self,
        goal_steer: float,
        lidar: LidarSummary,
        speed: float,
        now: float,
    ) -> tuple[float, float, bool]:
        """Choose the next rover command from phase, goal, lidar, and speed.

        Decision order matters here. Existing recovery phases run first, then
        the controller checks for pinned/stuck conditions, then hard-stop and
        avoidance conditions, and only falls back to normal `SEEK` when the
        rover has enough clearance to keep tracking the goal directly.
        """
        if self._phase == Phase.RECOVER_REVERSE:
            if now < self._phase_until and lidar.rear > self.config.rear_safe_cm:
                self._set_message(
                    f"Recovering reverse front={lidar.front:.0f} rear={lidar.rear:.0f} side={self._avoid_side}"
                )
                reverse_steer = -0.85 if self._avoid_side == "left" else 0.85
                return self.config.throttle_reverse, reverse_steer, False
            self._phase = Phase.RECOVER_TURN
            self._phase_until = now + self.config.turn_duration_s

        if self._phase == Phase.RECOVER_TURN:
            if now < self._phase_until:
                turn_steer = 1.0 if self._avoid_side == "left" else -1.0
                self._set_message(f"Recovering turn side={self._avoid_side}")
                return self.config.throttle_crawl, turn_steer, False
            self._phase = Phase.SEEK

        if self._is_pinned_against_obstacle(now, lidar, speed, goal_steer):
            self._avoid_side = self._pick_avoid_side(goal_steer, lidar)
            self._enter_recovery(now, reason="pinned")
            reverse_steer = -0.95 if self._avoid_side == "left" else 0.95
            return self.config.throttle_reverse, reverse_steer, False

        if self._is_stuck(now, speed):
            if self._needs_escape_recovery(lidar):
                self._avoid_side = self._pick_avoid_side(goal_steer, lidar)
                self._enter_recovery(now, reason="stuck")
                reverse_steer = -0.85 if self._avoid_side == "left" else 0.85
                return self.config.throttle_reverse, reverse_steer, False
            self._phase = Phase.SEEK
            self._last_progress_time = now
            steering = clamp(goal_steer, -self.config.steering_limit, self.config.steering_limit)
            self._set_message(f"Re-committing to goal steer={steering:.2f}")
            return self.config.throttle_fast, steering, False

        if lidar.front <= self.config.hard_stop_cm:
            if self._can_recover(lidar):
                self._avoid_side = self._pick_avoid_side(goal_steer, lidar)
                self._enter_recovery(now, reason="blocked")
                reverse_steer = -0.85 if self._avoid_side == "left" else 0.85
                return self.config.throttle_reverse, reverse_steer, False
            self._phase = Phase.HOLD
            self._set_message(f"Holding front={lidar.front:.0f} rear={lidar.rear:.0f}")
            return 0.0, 0.0, True

        if self._needs_avoidance(lidar):
            self._phase = Phase.AVOID
            steering = self._avoidance_steer(goal_steer, lidar)
            throttle = self.config.throttle_crawl
            self._set_message(
                f"Avoiding side={self._avoid_side} front={lidar.front:.0f} fl={lidar.front_left:.0f} fr={lidar.front_right:.0f}"
            )
            return throttle, steering, False

        self._phase = Phase.SEEK
        steering = clamp(goal_steer, -self.config.steering_limit, self.config.steering_limit)
        throttle = self.config.throttle_crawl if abs(steering) > 0.65 or speed > 7.0 else self.config.throttle_fast
        self._avoid_side = "left" if goal_steer >= 0 else "right"
        self._blocked_since = None
        distance = self.navigation_state["distance_to_goal"]
        distance_label = "n/a" if distance is None else f"{float(distance):.1f}"
        self._set_message(f"Seeking goal steer={steering:.2f} dist={distance_label}")
        return throttle, steering, False

    def _enter_recovery(self, now: float, reason: str) -> None:
        """Enter reverse recovery mode and track why the recovery began.

        Recovery always starts with a reverse stage; a later loop iteration will
        automatically transition into a forward turning stage before returning to
        `SEEK`.
        """
        self._phase = Phase.RECOVER_REVERSE
        self._phase_until = now + self.config.reverse_duration_s
        self._recoveries += 1
        self._last_progress_time = now
        self._set_message(f"Recovery {self._recoveries}: {reason} side={self._avoid_side}")

    def _needs_avoidance(self, lidar: LidarSummary) -> bool:
        if lidar.front <= self.config.caution_front_cm:
            return True
        return min(lidar.left, lidar.right) <= self.config.side_caution_cm

    def _can_recover(self, lidar: LidarSummary) -> bool:
        return lidar.rear > self.config.rear_safe_cm

    def _needs_escape_recovery(self, lidar: LidarSummary) -> bool:
        return (
            lidar.front <= self.config.caution_front_cm
            or min(lidar.left, lidar.right) <= self.config.side_caution_cm
        ) and self._can_recover(lidar)

    def _is_pinned_against_obstacle(
        self,
        now: float,
        lidar: LidarSummary,
        speed: float,
        goal_steer: float,
    ) -> bool:
        obstacle_close = (
            lidar.front <= self.config.caution_front_cm + 40.0
            or min(lidar.left, lidar.right) <= self.config.side_caution_cm + 25.0
        )
        trying_hard_to_turn = abs(goal_steer) >= 0.55 or self._phase == Phase.AVOID
        if obstacle_close and trying_hard_to_turn and speed <= self.config.blocked_speed_threshold_mps:
            if self._blocked_since is None:
                self._blocked_since = now
                return False
            return now - self._blocked_since >= self.config.blocked_detection_s
        self._blocked_since = None
        return False

    def _is_stuck(self, now: float, speed: float) -> bool:
        if speed >= self.config.moving_speed_threshold_mps:
            self._last_progress_time = now
            return False
        return now - self._last_progress_time >= self.config.progress_window_s

    def _avoidance_steer(self, goal_steer: float, lidar: LidarSummary) -> float:
        self._avoid_side = self._pick_avoid_side(goal_steer, lidar)
        turn_sign = 1.0 if self._avoid_side == "left" else -1.0
        if lidar.front <= self.config.sharp_turn_front_cm:
            return 0.98 * turn_sign
        front_bias = self._clearance_weight(lidar.front_right) - self._clearance_weight(lidar.front_left)
        side_bias = self._clearance_weight(lidar.right) - self._clearance_weight(lidar.left)
        steer = (0.85 * goal_steer) + (1.25 * front_bias) + (0.45 * side_bias) + (0.3 * turn_sign)
        return clamp(steer, -self.config.steering_limit, self.config.steering_limit)

    def _pick_avoid_side(self, goal_steer: float, lidar: LidarSummary) -> str:
        left_score = min(lidar.front_left, lidar.left)
        right_score = min(lidar.front_right, lidar.right)
        if abs(left_score - right_score) <= 15.0:
            return "left" if goal_steer >= 0 else "right"
        return "left" if left_score > right_score else "right"

    def _clearance_weight(self, clearance_cm: float) -> float:
        if clearance_cm >= self.config.caution_front_cm:
            return 0.0
        remaining = (self.config.caution_front_cm - clearance_cm) / self.config.caution_front_cm
        return clamp(remaining, 0.0, 1.0)

    def _goal_steer(self, position: List[float], goal: List[float], heading_deg: float) -> float:
        """Convert goal-relative heading error into the rover steering range.

        The result is normalized into the rover steering command range [-1, 1],
        where the sign matches the simulator heading convention used by the
        debug visualizer.
        """
        relative_deg = compute_goal_relative_heading_deg(
            (position[0], position[1]),
            (goal[0], goal[1]),
            heading_deg,
        )
        steer = relative_deg / 90.0
        return clamp(steer, -self.config.steering_limit, self.config.steering_limit)

    def _stop_motion(self, brakes: bool) -> None:
        """Issue a neutral steering and zero-throttle command."""
        self._command(0.0, 0.0, brakes)

    def _command(self, throttle: float, steering: float, brakes: bool) -> None:
        """Send a low-level control command set, rate-limited for actuator lag."""
        steering = float(clamp(steering, -self.config.steering_limit, self.config.steering_limit))
        throttle = float(throttle)
        now = time.monotonic()

        hold_elapsed = (now - self._last_command_time) >= self.config.min_command_hold_s
        brakes_changed = brakes != self._last_sent_brakes
        throttle_changed = abs(throttle - self._last_sent_throttle) >= self.config.throttle_deadband
        steering_changed = abs(steering - self._last_sent_steering) >= self.config.steering_deadband

        safety_critical = (
            brakes_changed
            or brakes
            or throttle < -1.0
            or self._phase in {Phase.HOLD, Phase.RECOVER_REVERSE, Phase.RECOVER_TURN}
        )

        if self._last_command_time > 0.0 and not safety_critical and not hold_elapsed:
            # Keep the prior command briefly so the rover has time to react.
            return

        if self._last_command_time > 0.0 and hold_elapsed and not safety_critical:
            if not throttle_changed and not steering_changed:
                return

        post_steering(steering)
        post_throttle(throttle)
        post_brakes(1 if brakes else 0)
        self._last_command_time = now
        self._last_sent_throttle = throttle
        self._last_sent_steering = steering
        self._last_sent_brakes = brakes
