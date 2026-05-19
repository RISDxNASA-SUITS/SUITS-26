# Run TSS + Java Backend Without Docker

This guide runs only:

- **TSS**: the C telemetry stream server
- **Java Backend**: the Kotlin/Javalin bridge that reads TSS over UDP and exposes REST + WebSocket APIs

It does not run the frontend, Python backend, Ollama, or Docker services.

## Terms

### TSS

TSS is the telemetry source. It serves a browser UI and also listens for UDP packets from clients such as the Java backend.

Default TSS address:

```text
http://localhost:14141
```

### Java Backend

The Java Backend is actually Kotlin running on the JVM. It connects to TSS over UDP, then exposes:

- REST endpoints such as `GET /telemetry`
- WebSocket stream at `WS /telemetry/live`

Default Java backend address:

```text
http://localhost:7070
ws://localhost:7070/telemetry/live
```

If port `7070` is already in use, run it on another port such as `7071`.

### Environment Variables

| Variable | Example | Meaning |
| --- | --- | --- |
| `JAVA_HTTP_PORT` | `7071` | Port where the Java backend listens for REST + WebSocket clients. |
| `TSS_HOST` | `127.0.0.1` | IP/hostname of the machine running TSS. Do not include a port here. |
| `TSS_UDP_PORT` | `14141` | UDP port where TSS receives telemetry commands. |
| `TSS_TIMEOUT_MS` | `3000` | Optional UDP timeout. |

Important:

```bash
# Correct
TSS_HOST=192.168.1.42 TSS_UDP_PORT=14141

# Incorrect: do not put the port in TSS_HOST
TSS_HOST=192.168.1.42:14141 TSS_UDP_PORT=14141
```

## Prerequisites

Install command line tools for compiling TSS:

```bash
xcode-select --install
```

Install Maven for running the Java backend:

```bash
brew install maven
```

Check that the tools are available:

```bash
gcc --version
mvn -version
java -version
```

## 1. Start TSS

Open Terminal 1:

```bash
cd /Users/varunsatheesh/SUITS-26/TSS
chmod +x ./build.bat
./build.bat
./server.exe
```

Expected output includes:

```text
Launching Server at IP: <your-ip>:14141
Creating HTTP Socket...
Creating UDP Socket...
Backend and simulation engine initialized successfully
```

Open the TSS UI in a browser:

```text
http://localhost:14141
```

If another machine needs to connect to TSS, use the IP printed in:

```text
Launching Server at IP: <your-ip>:14141
```

For the Java backend, use only the IP/hostname as `TSS_HOST`; keep `14141` in `TSS_UDP_PORT`.

## 2. Start the Java Backend

Open Terminal 2.

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

Example:

```bash
JAVA_HTTP_PORT=7071 TSS_HOST=192.168.1.42 TSS_UDP_PORT=14141 mvn exec:java
```

Use `JAVA_HTTP_PORT=7071` if port `7070` is already busy. If `7070` is free, this also works:

```bash
TSS_HOST=127.0.0.1 TSS_UDP_PORT=14141 mvn exec:java
```

## 3. Verify REST Telemetry

In another terminal:

```bash
curl -s http://localhost:7071/telemetry | head -c 300
```

If using port `7070`, use:

```bash
curl -s http://localhost:7070/telemetry | head -c 300
```

## 4. Verify WebSocket Broadcast

The live broadcast endpoint is:

```text
ws://localhost:7071/telemetry/live
```

Run this test client:

```bash
cd /Users/varunsatheesh/SUITS-26/JavaBackend
python3 test_live_telemetry_ws.py --host 127.0.0.1 --port 7071 --count 5
```

The script uses only Python's standard library. It opens
`ws://127.0.0.1:7071/telemetry/live`, prints five messages, then exits.

If using port `7070`, run:

```bash
python3 test_live_telemetry_ws.py --host 127.0.0.1 --port 7070 --count 5
```

Expected payload shape:

```json
{
  "timestamp": 1716076800000,
  "tssHost": "127.0.0.1",
  "tssConnected": true,
  "error": null,
  "rover": {
    "currentPosX": -5662.0,
    "currentPosY": -10095.3
  },
  "lidar": [120.0, 250.0]
}
```

If `tssConnected` is `false`, the WebSocket server is running, but the Java backend cannot get a valid UDP response from TSS. Check `TSS_HOST`, `TSS_UDP_PORT`, firewall settings, and whether TSS is still running.

## Troubleshooting

### `mvn: command not found`

Install Maven:

```bash
brew install maven
```

### `Port already in use`

Something is already using the Java backend port.

Find the process:

```bash
lsof -nP -iTCP:7070 -sTCP:LISTEN
```

Or use a different Java backend port:

```bash
JAVA_HTTP_PORT=7071 TSS_HOST=127.0.0.1 TSS_UDP_PORT=14141 mvn exec:java
```

### TSS build fails

Make sure `gcc` is installed:

```bash
gcc --version
```

If it is missing:

```bash
xcode-select --install
```

### TSS appears up but Java reports `tssConnected: false`

Use these checks:

- TSS terminal is still running `./server.exe`
- `TSS_HOST` is only an IP/hostname, not `ip:port`
- `TSS_UDP_PORT=14141`
- TSS and Java are on the same network if they are on different machines
- macOS firewall is not blocking inbound/outbound traffic

## Quick Command Summary

Terminal 1:

```bash
cd /Users/varunsatheesh/SUITS-26/TSS
chmod +x ./build.bat
./build.bat
./server.exe
```

Terminal 2:

```bash
cd /Users/varunsatheesh/SUITS-26/JavaBackend
JAVA_HTTP_PORT=7071 TSS_HOST=127.0.0.1 TSS_UDP_PORT=14141 mvn exec:java
```

Terminal 3:

```bash
curl -s http://localhost:7071/telemetry | head -c 300
```
