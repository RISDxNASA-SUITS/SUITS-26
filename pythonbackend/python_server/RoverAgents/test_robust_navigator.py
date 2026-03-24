import math
import sys
import time
import types
import unittest


stub_helpers = types.ModuleType("python_server.RoverAgents.helper_functions")
stub_helpers.euclidean_distance = lambda a, b: math.dist(a, b)
stub_helpers.clamp = lambda value, low, high: max(low, min(high, value))
stub_helpers.compute_goal_relative_heading_deg = (
    lambda position, goal, heading_deg:
    ((90.0 - math.degrees(math.atan2(goal[1] - position[1], goal[0] - position[0])) + 360.0) % 360.0 - ((heading_deg + 360.0) % 360.0) + 540.0) % 360.0 - 180.0
)
stub_helpers.normalize_lidar = lambda lidar, default_lidar_cm: [
    default_lidar_cm if (not isinstance(raw, (int, float)) or float(raw) < 1) else float(raw)
    for raw in lidar
]
class _LidarSummary:
    def __init__(self, front, front_left, front_right, left, right, rear):
        self.front = front
        self.front_left = front_left
        self.front_right = front_right
        self.left = left
        self.right = right
        self.rear = rear
stub_helpers.LidarSummary = _LidarSummary
stub_helpers.summarize_lidar = lambda lidar, default_lidar_cm: _LidarSummary(
    min((float(lidar[i]) if i < len(lidar) else default_lidar_cm) for i in (1, 2, 3)),
    min((float(lidar[i]) if i < len(lidar) else default_lidar_cm) for i in (1, 5, 6)),
    min((float(lidar[i]) if i < len(lidar) else default_lidar_cm) for i in (3, 8, 13)),
    min((float(lidar[i]) if i < len(lidar) else default_lidar_cm) for i in (0, 5, 6, 7)),
    min((float(lidar[i]) if i < len(lidar) else default_lidar_cm) for i in (4, 8, 13, 14)),
    min((float(lidar[i]) if i < len(lidar) else default_lidar_cm) for i in (9, 10, 11, 12, 16)),
)
sys.modules["python_server.RoverAgents.helper_functions"] = stub_helpers

stub_client = types.ModuleType("python_server.RoverAgents.rover_client")
stub_client.get_lidar = lambda: None
stub_client.get_telemetry = lambda: None
stub_client.post_brakes = lambda _: (200, "ok")
stub_client.post_steering = lambda _: (200, "ok")
stub_client.post_throttle = lambda _: (200, "ok")
sys.modules["python_server.RoverAgents.rover_client"] = stub_client

from python_server.RoverAgents.RobustNavigator import LidarSummary, Phase, RobustNavigator


class RobustNavigatorTest(unittest.TestCase):
    def setUp(self) -> None:
        self.navigator = RobustNavigator()

    def test_pick_avoid_side_prefers_opener_side(self) -> None:
        lidar = LidarSummary(
            front=180.0,
            front_left=320.0,
            front_right=140.0,
            left=310.0,
            right=150.0,
            rear=500.0,
        )

        side = self.navigator._pick_avoid_side(goal_steer=0.0, lidar=lidar)

        self.assertEqual(side, "left")

    def test_pick_avoid_side_uses_goal_direction_when_balanced(self) -> None:
        lidar = LidarSummary(
            front=190.0,
            front_left=240.0,
            front_right=245.0,
            left=250.0,
            right=248.0,
            rear=500.0,
        )

        side = self.navigator._pick_avoid_side(goal_steer=-0.4, lidar=lidar)

        self.assertEqual(side, "right")

    def test_stuck_detection_uses_progress_timeout(self) -> None:
        self.navigator._last_progress_time = time.monotonic() - (
            self.navigator.config.progress_window_s + 0.25
        )

        self.assertTrue(self.navigator._is_stuck(time.monotonic(), 0.0))

    def test_stuck_detection_resets_when_speed_shows_motion(self) -> None:
        self.navigator._last_progress_time = time.monotonic() - (
            self.navigator.config.progress_window_s + 0.25
        )

        self.assertFalse(
            self.navigator._is_stuck(
                time.monotonic(),
                self.navigator.config.moving_speed_threshold_mps + 0.05,
            )
        )

    def test_compute_command_enters_recovery_on_hard_stop(self) -> None:
        self.navigator._begin_navigation([10.0, 10.0])
        lidar = LidarSummary(
            front=90.0,
            front_left=100.0,
            front_right=260.0,
            left=110.0,
            right=300.0,
            rear=400.0,
        )

        throttle, steering, brakes = self.navigator._compute_command(
            goal_steer=0.1,
            lidar=lidar,
            speed=0.0,
            now=time.monotonic(),
        )

        self.assertEqual(self.navigator._phase, Phase.RECOVER_REVERSE)
        self.assertEqual(self.navigator._avoid_side, "right")
        self.assertLess(throttle, 0.0)
        self.assertFalse(brakes)
        self.assertGreater(steering, 0.0)

    def test_compute_command_seeks_goal_when_clear(self) -> None:
        self.navigator._begin_navigation([10.0, 10.0])
        lidar = LidarSummary(
            front=800.0,
            front_left=700.0,
            front_right=700.0,
            left=650.0,
            right=650.0,
            rear=650.0,
        )

        throttle, steering, brakes = self.navigator._compute_command(
            goal_steer=-0.3,
            lidar=lidar,
            speed=0.0,
            now=time.monotonic(),
        )

        self.assertEqual(self.navigator._phase, Phase.SEEK)
        self.assertGreater(throttle, 0.0)
        self.assertAlmostEqual(steering, -0.3)
        self.assertFalse(brakes)

    def test_stuck_with_clear_front_recommits_to_goal(self) -> None:
        self.navigator._begin_navigation([10.0, 10.0])
        self.navigator._last_progress_time = time.monotonic() - (
            self.navigator.config.progress_window_s + 0.25
        )
        lidar = LidarSummary(
            front=520.0,
            front_left=430.0,
            front_right=560.0,
            left=405.0,
            right=409.0,
            rear=307.0,
        )

        throttle, steering, brakes = self.navigator._compute_command(
            goal_steer=1.0,
            lidar=lidar,
            speed=0.0,
            now=time.monotonic(),
        )

        self.assertEqual(self.navigator._phase, Phase.SEEK)
        self.assertGreater(throttle, 0.0)
        self.assertAlmostEqual(steering, 1.0)
        self.assertFalse(brakes)

    def test_pinned_against_obstacle_triggers_recovery(self) -> None:
        self.navigator._begin_navigation([10.0, 10.0])
        lidar = LidarSummary(
            front=272.0,
            front_left=273.0,
            front_right=328.0,
            left=354.0,
            right=201.0,
            rear=260.0,
        )
        now = time.monotonic()
        self.navigator._blocked_since = now - (
            self.navigator.config.blocked_detection_s + 0.05
        )

        throttle, steering, brakes = self.navigator._compute_command(
            goal_steer=0.88,
            lidar=lidar,
            speed=0.0,
            now=now,
        )

        self.assertEqual(self.navigator._phase, Phase.RECOVER_REVERSE)
        self.assertLess(throttle, 0.0)
        self.assertGreaterEqual(abs(steering), 0.95)
        self.assertFalse(brakes)

    def test_goal_steer_matches_heading_convention(self) -> None:
        self.assertAlmostEqual(
            self.navigator._goal_steer([0.0, 0.0], [0.0, 10.0], 0.0),
            0.0,
        )
        self.assertAlmostEqual(
            self.navigator._goal_steer([0.0, 0.0], [10.0, 0.0], 0.0),
            1.0,
        )
        self.assertAlmostEqual(
            self.navigator._goal_steer([0.0, 0.0], [-10.0, 0.0], 0.0),
            -1.0,
        )

    def test_avoidance_steer_turns_sharp_when_front_is_tight(self) -> None:
        lidar = LidarSummary(
            front=150.0,
            front_left=320.0,
            front_right=120.0,
            left=310.0,
            right=110.0,
            rear=400.0,
        )

        steering = self.navigator._avoidance_steer(goal_steer=0.0, lidar=lidar)

        self.assertGreaterEqual(steering, 0.95)
        self.assertEqual(self.navigator._avoid_side, "left")


if __name__ == "__main__":
    unittest.main()
