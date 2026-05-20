#!/usr/bin/env python3
"""Print live telemetry messages from the Java backend WebSocket.

This uses only Python's standard library so it can run without installing
extra packages.
"""

import argparse
import base64
import json
import os
import socket
import struct
from typing import Optional


def recv_exact(sock: socket.socket, n: int) -> bytes:
    data = b""
    while len(data) < n:
        chunk = sock.recv(n - len(data))
        if not chunk:
            raise EOFError("socket closed")
        data += chunk
    return data


def recv_frame(sock: socket.socket) -> Optional[str]:
    header = recv_exact(sock, 2)
    opcode = header[0] & 0x0F
    length = header[1] & 0x7F

    if length == 126:
        length = struct.unpack(">H", recv_exact(sock, 2))[0]
    elif length == 127:
        length = struct.unpack(">Q", recv_exact(sock, 8))[0]

    payload = recv_exact(sock, length)

    if opcode == 8:
        return None
    if opcode != 1:
        return ""
    return payload.decode("utf-8")


def connect(host: str, port: int, path: str, timeout: float) -> socket.socket:
    key = base64.b64encode(os.urandom(16)).decode("ascii")
    request = (
        f"GET {path} HTTP/1.1\r\n"
        f"Host: {host}:{port}\r\n"
        "Upgrade: websocket\r\n"
        "Connection: Upgrade\r\n"
        f"Sec-WebSocket-Key: {key}\r\n"
        "Sec-WebSocket-Version: 13\r\n\r\n"
    )

    sock = socket.create_connection((host, port), timeout=timeout)
    sock.settimeout(timeout)
    sock.sendall(request.encode("ascii"))
    response = sock.recv(4096)

    if b" 101 " not in response.split(b"\r\n", 1)[0]:
        raise RuntimeError(response.decode("utf-8", errors="replace"))

    return sock


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Read messages from ws://HOST:PORT/telemetry/live"
    )
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=7071)
    parser.add_argument("--path", default="/telemetry/live")
    parser.add_argument("--count", type=int, default=5)
    parser.add_argument("--timeout", type=float, default=10.0)
    args = parser.parse_args()

    sock = connect(args.host, args.port, args.path, args.timeout)
    print(f"Connected to ws://{args.host}:{args.port}{args.path}")

    try:
        for _ in range(args.count):
            raw = recv_frame(sock)
            if raw is None:
                print("WebSocket closed by server")
                break
            if not raw:
                continue

            message = json.loads(raw)
            print(json.dumps(message, indent=2))
            print("-" * 80)
    finally:
        sock.close()


if __name__ == "__main__":
    main()
