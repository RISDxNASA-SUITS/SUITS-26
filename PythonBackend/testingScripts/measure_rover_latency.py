import argparse
import statistics
import time
from typing import Callable, Dict, Optional

import requests


def get_telemetry(base_url: str) -> Dict[str, float]:
    response = requests.get(f"{base_url}/telemetry", timeout=1.0)
    response.raise_for_status()
    return response.json()


def post_command(base_url: str, endpoint: str, payload: Dict[str, float]) -> float:
    started = time.perf_counter()
    response = requests.post(
        f"{base_url}/{endpoint}",
        json=payload,
        timeout=2.0,
    )
    response.raise_for_status()
    return time.perf_counter() - started


def wait_for_condition(
    base_url: str,
    condition: Callable[[Dict[str, float]], bool],
    timeout_s: float,
    poll_s: float,
) -> Optional[float]:
    started = time.perf_counter()
    while (time.perf_counter() - started) < timeout_s:
        telemetry = get_telemetry(base_url)
        if condition(telemetry):
            return time.perf_counter() - started
        time.sleep(poll_s)
    return None


def make_reflection_condition(command: str, target: float, tolerance: float) -> Callable[[Dict[str, float]], bool]:
    field = command

    def _condition(telemetry: Dict[str, float]) -> bool:
        value = float(telemetry.get(field, 0.0))
        return abs(value - target) <= tolerance

    return _condition


def make_motion_condition(
    command: str,
    baseline: Dict[str, float],
    target: float,
    speed_threshold: float,
    heading_threshold_deg: float,
) -> Callable[[Dict[str, float]], bool]:
    baseline_speed = float(baseline.get("speed", 0.0))
    baseline_heading = float(baseline.get("heading", 0.0))

    def _condition(telemetry: Dict[str, float]) -> bool:
        speed = float(telemetry.get("speed", 0.0))
        heading = float(telemetry.get("heading", 0.0))
        brakes = bool(telemetry.get("brakes", False))

        if command == "throttle":
            if abs(target) < 0.01:
                return abs(speed) <= speed_threshold
            return abs(speed - baseline_speed) >= speed_threshold
        if command == "steering":
            return abs(heading - baseline_heading) >= heading_threshold_deg
        if command == "brakes":
            return brakes == (target >= 0.5)
        return False

    return _condition


def summary(values: list[float]) -> str:
    if not values:
        return "n/a"
    median = statistics.median(values)
    p95 = max(values) if len(values) < 20 else statistics.quantiles(values, n=20)[18]
    return f"median={median:.3f}s p95={p95:.3f}s max={max(values):.3f}s"


def main() -> None:
    parser = argparse.ArgumentParser(description="Measure rover command latency by polling telemetry.")
    parser.add_argument("--base-url", default="http://localhost:7070", help="Java backend base URL")
    parser.add_argument("--command", choices=["throttle", "steering", "brakes"], required=True)
    parser.add_argument("--value", type=float, required=True, help="Target command value")
    parser.add_argument("--runs", type=int, default=5, help="Number of repeated measurements")
    parser.add_argument("--poll-ms", type=int, default=100, help="Telemetry polling interval in ms")
    parser.add_argument("--timeout-s", type=float, default=5.0, help="Timeout per reflection/motion wait")
    parser.add_argument("--settle-s", type=float, default=1.0, help="Pause between runs in seconds")
    parser.add_argument("--speed-threshold", type=float, default=0.2, help="Motion threshold for throttle tests in m/s")
    parser.add_argument("--heading-threshold-deg", type=float, default=2.0, help="Motion threshold for steering tests in degrees")
    parser.add_argument("--tolerance", type=float, default=0.01, help="Allowed difference when checking reflected command value")
    args = parser.parse_args()

    payload_key = {
        "throttle": "throttleInput",
        "steering": "steeringInput",
        "brakes": "brakeInput",
    }[args.command]

    print(f"Testing {args.command}={args.value} against {args.base_url}")
    print("Make sure auto-navigation is cancelled before running this.")

    accept_latencies: list[float] = []
    reflect_latencies: list[float] = []
    motion_latencies: list[float] = []

    for run in range(1, args.runs + 1):
        baseline = get_telemetry(args.base_url)
        accept_s = post_command(args.base_url, args.command, {payload_key: args.value})
        reflect_s = wait_for_condition(
            args.base_url,
            make_reflection_condition(args.command, args.value, args.tolerance),
            args.timeout_s,
            args.poll_ms / 1000.0,
        )
        motion_s = wait_for_condition(
            args.base_url,
            make_motion_condition(
                args.command,
                baseline,
                args.value,
                args.speed_threshold,
                args.heading_threshold_deg,
            ),
            args.timeout_s,
            args.poll_ms / 1000.0,
        )

        accept_latencies.append(accept_s)
        if reflect_s is not None:
            reflect_latencies.append(reflect_s)
        if motion_s is not None:
            motion_latencies.append(motion_s)

        reflect_label = f"{reflect_s:.3f}s" if reflect_s is not None else "timeout"
        motion_label = f"{motion_s:.3f}s" if motion_s is not None else "timeout"
        print(
            f"run {run}: "
            f"accept={accept_s:.3f}s "
            f"reflect={reflect_label} "
            f"motion={motion_label}"
        )
        time.sleep(args.settle_s)

    print("")
    print(f"accept:  {summary(accept_latencies)}")
    print(f"reflect: {summary(reflect_latencies)}")
    print(f"motion:  {summary(motion_latencies)}")


if __name__ == "__main__":
    main()
