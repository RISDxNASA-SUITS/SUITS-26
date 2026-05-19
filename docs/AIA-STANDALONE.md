# Run AIA (EVA API)

Two ways to run AIA. In both cases, **AIA only talks to the Java Hub** (port `7070`), not to TSS directly.

| | **Mode 1 — Docker** | **Mode 2 — No Docker** |
|--|---------------------|-------------------------|
| Ollama | Inside Docker | Installed on your machine |
| AIA (port `8000`) | `eva-backend` container | `./scripts/aia-start.sh` |
| Java Hub IP | Needed if Hub is on **another** computer | Always enter at start |

---

## Mode 1 — Docker

Use this for local / lab setups, or when you want Ollama and AIA in containers.

### A. Everything on one computer

TSS, Java Hub, Ollama, and AIA all run in Docker on the same machine. **No Java IP needed** (Hub is `http://java-backend:7070` inside Compose).

**Start** (from repo root):

```bash
docker compose -f docker-compose.yaml up -d --build c-backend java-backend ollama eva-backend
```

First start may take several minutes (`ollama-init` pulls `llama3.2`).

**Check:**

```bash
curl -s http://127.0.0.1:7070/ev-telemetry/1 | head -c 80
curl -s http://127.0.0.1:8000/agent/status
```

**Stop:**

```bash
docker compose -f docker-compose.yaml stop eva-backend ollama java-backend c-backend
```

Or stop all Compose services:

```bash
docker compose -f docker-compose.yaml down
```

---

### B. Java Hub on another computer

Example: Java Hub runs on `192.168.1.20` (Docker or not). On the **AIA machine**, run only Ollama + AIA in Docker and point AIA at that IP.

**Start Ollama** (repo root):

```bash
docker compose -f docker-compose.yaml up -d ollama
docker compose -f docker-compose.yaml run --rm ollama-init
```

**Start AIA** — set the Java Hub IP (replace with your value):

```bash
export JAVA_IP=192.168.1.20

docker compose -f docker-compose.yaml run -d --no-deps \
  -p 8000:8000 \
  -e EVA_JAVA_BACKEND_URL=http://${JAVA_IP}:7070 \
  -e EVA_OLLAMA_BASE_URL=http://ollama:11434 \
  -e EVA_OLLAMA_MODEL=llama3.2 \
  -e EVA_AGENTIC_ENABLED=true \
  -e EVA_LIVE_TELEMETRY=true \
  --name suits-eva-backend \
  eva-backend
```

**Check:**

```bash
curl -s http://127.0.0.1:8000/agent/status
# expect "java_backend_reachable": true
```

**Stop:**

```bash
docker stop suits-eva-backend
docker compose -f docker-compose.yaml stop ollama
```

Do **not** also run `./scripts/aia-start.sh` — only one AIA process can use port `8000`.

---

## Mode 2 — No Docker (competition AIA laptop)

Use this on the dedicated AIA device: **local Ollama app** + **`aia-start.sh`**. Java Hub runs elsewhere; you enter its IP when starting.

### Before competition (one time)

**1. Install Ollama**

- macOS / Windows: download from [https://ollama.com](https://ollama.com) and open the app  
- Linux: `curl -fsSL https://ollama.com/install.sh | sh`

**2. Download the model (needs internet)**

```bash
ollama pull llama3.2
```

**3. Confirm Ollama is running**

```bash
curl -s http://127.0.0.1:11434/api/tags
```

You should see `llama3.2` in the output.

**4. Clone repo and set config**

```bash
git clone https://github.com/RISDxNASA-SUITS/SUITS-26.git
cd SUITS-26
cp backend/.env.competition backend/.env
```

---

### Start / stop (competition day)

**Start** — pass the Java Hub machine IP:

```bash
./scripts/aia-start.sh 192.168.1.20
```

Or run without an argument to be prompted:

```bash
./scripts/aia-start.sh
# Java Hub IP address: 192.168.1.20
```

The script checks Hub reachability, then starts AIA on port `8000`.  
Logs: `backend/.run/aia.log`

**Check:**

```bash
curl -s http://127.0.0.1:8000/agent/status
curl -s -X POST http://127.0.0.1:8000/command \
  -H 'Content-Type: application/json' \
  -d '{"text":"what is the battery level?"}'
```

**Stop:**

```bash
./scripts/aia-stop.sh
```

---

## Optional: React UI

On any machine that can reach Java Hub and AIA:

```bash
cd frontend && npm install && npm run dev
```

Open the URL Vite prints (e.g. `http://localhost:5173`). Ask EVA uses the `/eva` proxy to AIA on port `8000`.

---

## Quick fixes

| Problem | Fix |
|---------|-----|
| Port `8000` in use | `./scripts/aia-stop.sh` or `docker stop suits-26-eva-backend-1` |
| `preflight failed` / Hub unreachable | Wrong Java IP or Hub not running — test `curl http://<JAVA_IP>:7070/ev-telemetry/1` |
| `LLM_UNAVAILABLE` (Mode 2) | Start Ollama app; run `ollama pull llama3.2` |
| Rule-only fallback (no Ollama) | `cp backend/.env.example backend/.env` then restart AIA |
