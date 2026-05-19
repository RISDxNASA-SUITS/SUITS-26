# Run AIA

AIA is the EVA FastAPI service on port **8000**. It only talks to the **Java Hub** (`7070`), not to TSS directly.

Two ways to run it:

| | **Mode 1 — Docker** | **Mode 2 — No Docker** (competition laptop) |
|--|---------------------|---------------------------------------------|
| AIA | `eva-backend` container | `./scripts/aia-start.sh <JAVA_IP>` |
| Ollama | Docker container | Install on your Mac ([ollama.com](https://ollama.com)) |
| Java Hub IP | Same machine: automatic. Other machine: use Mode 2. | **Required** — pass as argument: `./scripts/aia-start.sh <JAVA_IP>` |

---

## Mode 1 — Docker (AIA + Ollama in containers)

Use for local / lab when TSS, Java, Ollama, and AIA all run on **one computer**.

**Start** (repo root):

```bash
docker compose -f docker-compose.yaml up -d --build c-backend java-backend ollama eva-backend
```

**Stop:**

```bash
docker compose -f docker-compose.yaml stop eva-backend ollama java-backend c-backend
```

**Check:**

```bash
curl -s http://127.0.0.1:8000/agent/status
```

Do **not** run `./scripts/aia-start.sh` at the same time — both use port `8000`.

If the Java Hub is on **another computer**, use **Mode 2** instead.

---

## Mode 2 — No Docker (scripts)

Use on the **AIA laptop** at competition. Ollama runs as a normal app on this machine.

### One-time setup

1. Install Ollama from [https://ollama.com](https://ollama.com) and open it.

2. Download the model **before** competition (needs internet):

```bash
ollama pull llama3.2
```

3. Check Ollama:

```bash
curl -s http://127.0.0.1:11434/api/tags
```

4. Use the competition config:

```bash
cp backend/.env.competition backend/.env
```

### Start / stop AIA

Java Hub must already be running. **Always pass the Java Hub machine IP** as the first argument (competition: the IP of the computer running Java Hub, not this laptop).

```bash
# Start (background) — replace with your Java Hub IP
./scripts/aia-start.sh 192.168.1.20

# Custom port (default 7070)
./scripts/aia-start.sh 192.168.1.20:7070

# Local test only (Java Hub on this same machine)
./scripts/aia-start.sh 127.0.0.1

# Foreground (logs in terminal, Ctrl+C to stop)
./scripts/aia-start.sh 192.168.1.20 --foreground

# Stop
./scripts/aia-stop.sh

# Help
./scripts/aia-start.sh --help
```

The script writes `EVA_JAVA_BACKEND_URL=http://<JAVA_IP>:7070` into `backend/.env`, checks Hub reachability, then starts AIA. Wrong IP or Hub down → start aborts.

Background logs: `backend/.run/aia.log`

**Check:**

```bash
curl -s http://127.0.0.1:8000/agent/status
curl -s http://127.0.0.1:8000/health
```

Expected: `"java_backend_reachable": true`, `"agentic_enabled": true` (if using `.env.competition`).

### Rule-based only (no Ollama)

```bash
cp backend/.env.example backend/.env
./scripts/aia-start.sh <JAVA_IP>
```

Use exact phrases like `battery status` (not free-form questions).

---

## Optional: frontend

```bash
cd frontend && npm run dev
```

Ask EVA in the UI talks to AIA via the `/eva` proxy (port `8000` on this machine).

---

## Problems

| Issue | Fix |
|-------|-----|
| Port `8000` in use | `./scripts/aia-stop.sh` or `docker stop suits-26-eva-backend-1` |
| `preflight failed` | Wrong Java IP or Hub down — `curl http://<JAVA_IP>:7070/ev-telemetry/1` |
| `LLM_UNAVAILABLE` | Start Ollama; `ollama pull llama3.2` |
