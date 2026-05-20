#!/usr/bin/env python3
"""Print full mission telemetry messages from ws://HOST:PORT/telemetry/mission/live."""

import argparse
import json
import sys

from test_live_telemetry_ws import connect, recv_frame


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Read messages from ws://HOST:PORT/telemetry/mission/live"
    )
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=7071)
    parser.add_argument("--path", default="/telemetry/mission/live")
    parser.add_argument("--count", type=int, default=3)
    parser.add_argument("--timeout", type=float, default=10.0)
    args = parser.parse_args()

    sock = connect(args.host, args.port, args.path, args.timeout)
    print(f"Connected to ws://{args.host}:{args.port}{args.path}")

    received = 0
    while received < args.count:
        frame = recv_frame(sock)
        if frame is None:
            print("Connection closed")
            break
        if not frame:
            continue
        received += 1
        try:
            payload = json.loads(frame)
            keys = sorted(payload.keys())
            hub_error = payload.get("hub_error")
            print(f"[{received}] keys={keys} hub_error={hub_error!r}")
        except json.JSONDecodeError:
            print(f"[{received}] (non-JSON) {frame[:120]}...")

    sock.close()
    if received == 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
