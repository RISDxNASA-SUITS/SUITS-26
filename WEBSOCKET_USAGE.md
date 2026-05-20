# Java Backend WebSocket Usage

This guide explains how other services can connect to the Java backend live telemetry WebSockets.

## Endpoints

### Rover + lidar (map / dashboard)

The Java backend broadcasts rover position and lidar at:

```text
ws://<JAVA_BACKEND_HOST>:<JAVA_HTTP_PORT>/telemetry/live
```

Common local example:

```text
ws://localhost:7071/telemetry/live
```

If the Java backend is running on the default port:

```text
ws://localhost:7070/telemetry/live
```

Use `localhost` only when the client is running on the same machine as the Java backend. If another computer or service connects, use the Java backend machine's IP address or hostname.

Examples:

```text
ws://127.0.0.1:7071/telemetry/live
ws://192.168.1.20:7071/telemetry/live
ws://java-backend:7070/telemetry/live
```

## Start the Java Backend

If TSS is running on the same machine:

```bash
cd /Users/varunsatheesh/SUITS-26/JavaBackend
JAVA_HTTP_PORT=7071 TSS_HOST=127.0.0.1 TSS_UDP_PORT=14141 mvn exec:java
```

If TSS is running on another machine:

```bash
cd /Users/varunsatheesh/SUITS-26/JavaBackend
JAVA_HTTP_PORT=7071 TSS_HOST=<TSS_IP_ONLY> TSS_UDP_PORT=14141 mvn exec:java
```

Do not include the port inside `TSS_HOST`.

Correct:

```bash
TSS_HOST=192.168.1.42 TSS_UDP_PORT=14141
```

Incorrect:

```bash
TSS_HOST=192.168.1.42:14141 TSS_UDP_PORT=14141
```

## Payload

Every broadcast message is JSON:

```json
{
  "timestamp": 1716076800000,
  "tssHost": "127.0.0.1",
  "tssConnected": true,
  "error": null,
  "rover": {
    "currentPosX": -5662.0,
    "currentPosY": -10095.3,
    "heading": 0.0,
    "speed": 0.0,
    "batteryLevel": 100.0
  },
  "lidar": [120.0, 250.0, -1.0]
}
```

Important fields:

| Field | Meaning |
| --- | --- |
| `timestamp` | Java backend timestamp in milliseconds. |
| `tssHost` | TSS host/IP the Java backend is trying to read from. |
| `tssConnected` | `true` when TSS responded successfully, otherwise `false`. |
| `error` | Error message when `tssConnected` is `false`; otherwise `null`. |
| `rover` | Rover telemetry object, same general shape as `GET /telemetry`. |
| `lidar` | Array of rover lidar readings. |

If `tssConnected` is `false`, the WebSocket itself is still working, but the Java backend cannot read TSS over UDP. Check `TSS_HOST`, `TSS_UDP_PORT`, firewall settings, and whether TSS is running.

### Full mission bundle (EVA AIA)

The EVA AIA backend consumes the **full mission telemetry** stream at:

```text
ws://<JAVA_BACKEND_HOST>:<JAVA_HTTP_PORT>/telemetry/mission/live
```

Example:

```text
ws://localhost:7071/telemetry/mission/live
```

Each message is JSON matching the Python `LiveTelemetryBundle` used by `GET /telemetry/full`:

```json
{
  "polled_at_unix": 1716076800.123,
  "ev1": {},
  "ev2": {},
  "dcu1": {},
  "dcu2": {},
  "errors": {},
  "imu1": {},
  "imu2": {},
  "uia": {},
  "eva_states": {},
  "rover": {},
  "lidar": { "data": [120.0, 250.0] },
  "ltv": {},
  "ltv_errors": {},
  "hub_error": null
}
```

| Field | Meaning |
| --- | --- |
| `polled_at_unix` | Unix time when the bundle was assembled |
| `ev1` … `ltv_errors` | Same shapes as the matching Java REST endpoints |
| `hub_error` | Optional semicolon-separated errors when TSS subsystems are unavailable |

Configure the AIA backend:

| Variable | Default | Purpose |
| --- | --- | --- |
| `EVA_JAVA_TELEMETRY_TRANSPORT` | `websocket` | `websocket` (mission WS) or `http` (REST poll fallback) |
| `EVA_JAVA_BACKEND_URL` | `http://localhost:7070` | Used to derive the WebSocket URL when `EVA_JAVA_BACKEND_WS_URL` is unset |
| `EVA_JAVA_BACKEND_WS_URL` | *(unset)* | Override full mission WebSocket URL |

Quick test:

```bash
cd /Users/varunsatheesh/SUITS-26/JavaBackend
python3 test_mission_telemetry_ws.py --host 127.0.0.1 --port 7071 --count 3
```

## Quick Test Client

This repo includes a standard-library Python test client:

```bash
cd /Users/varunsatheesh/SUITS-26/JavaBackend
python3 test_live_telemetry_ws.py --host 127.0.0.1 --port 7071 --count 5
```

For port `7070`:

```bash
python3 test_live_telemetry_ws.py --host 127.0.0.1 --port 7070 --count 5
```

The script prints five broadcast messages and exits.

## Python Service Example

Install:

```bash
pip install websockets
```

Client:

```python
import asyncio
import json
import websockets


async def main():
    uri = "ws://localhost:7071/telemetry/live"

    async with websockets.connect(uri) as ws:
        async for raw in ws:
            message = json.loads(raw)

            if not message["tssConnected"]:
                print("TSS unavailable:", message["error"])
                continue

            rover = message["rover"]
            lidar = message["lidar"]

            print("position:", rover["currentPosX"], rover["currentPosY"])
            print("heading:", rover["heading"])
            print("lidar:", lidar)


asyncio.run(main())
```

## Python Service With Reconnect

Long-running services should reconnect if the Java backend restarts:

```python
import asyncio
import json
import websockets


URI = "ws://localhost:7071/telemetry/live"


def handle(message):
    if not message["tssConnected"]:
        print("TSS unavailable:", message["error"])
        return

    rover = message["rover"]
    print("rover:", rover["currentPosX"], rover["currentPosY"])


async def listen_forever():
    while True:
        try:
            async with websockets.connect(URI) as ws:
                print("connected")
                async for raw in ws:
                    handle(json.loads(raw))
        except Exception as exc:
            print("websocket disconnected, retrying:", exc)
            await asyncio.sleep(2)


asyncio.run(listen_forever())
```

## Node Service Example

Install:

```bash
npm install ws
```

Client:

```js
import WebSocket from "ws";

const ws = new WebSocket("ws://localhost:7071/telemetry/live");

ws.on("open", () => {
  console.log("connected");
});

ws.on("message", (raw) => {
  const message = JSON.parse(raw.toString());

  if (!message.tssConnected) {
    console.warn("TSS unavailable:", message.error);
    return;
  }

  console.log("position:", message.rover.currentPosX, message.rover.currentPosY);
  console.log("lidar:", message.lidar);
});

ws.on("close", () => {
  console.log("closed");
});

ws.on("error", (err) => {
  console.error("websocket error:", err);
});
```

## Browser Example

```js
const ws = new WebSocket("ws://localhost:7071/telemetry/live");

ws.onopen = () => {
  console.log("connected");
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  if (!message.tssConnected) {
    console.warn("TSS unavailable:", message.error);
    return;
  }

  console.log("rover:", message.rover);
  console.log("lidar:", message.lidar);
};

ws.onclose = () => {
  console.log("closed");
};
```

## Service-to-Service Host Rules

Use the right host depending on where the client runs:

| Client location | WebSocket URL |
| --- | --- |
| Same machine as Java backend | `ws://localhost:7071/telemetry/live` |
| Different machine on same network | `ws://<JAVA_BACKEND_IP>:7071/telemetry/live` |
| Docker Compose service | `ws://java-backend:7070/telemetry/live` |
| Browser through Vite dev proxy | `ws://localhost:<vite-port>/hub/telemetry/live` |

The port in the WebSocket URL is the Java backend HTTP port (`JAVA_HTTP_PORT`), not the TSS UDP port.

## Current Behavior

The current WebSocket broadcasts the same telemetry payload to every connected client. Clients do not need to send any message after connecting.

If later a service needs to request a specific stream, the future pattern should be:

```json
{
  "type": "subscribe",
  "stream": "rover"
}
```

That subscription behavior is not implemented yet.

## Troubleshooting

### WebSocket connects, but `tssConnected` is `false`

The WebSocket server is running, but the Java backend cannot read TSS over UDP.

Check:

- TSS is running.
- `TSS_HOST` is an IP or hostname only.
- `TSS_UDP_PORT=14141`.
- The TSS machine allows UDP traffic on port `14141`.
- The Java backend and TSS are on the same network if they are on different machines.

### Connection refused

The Java backend is not running on that host/port.

Check:

```bash
curl -s http://localhost:7071/telemetry | head -c 300
```

If using port `7070`, change `7071` to `7070`.

### Port already in use

Start the Java backend on another port:

```bash
JAVA_HTTP_PORT=7071 TSS_HOST=127.0.0.1 TSS_UDP_PORT=14141 mvn exec:java
```

Then connect to:

```text
ws://localhost:7071/telemetry/live
```
