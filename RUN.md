# How to run SUITS-26 (quick guide)

Everything you need to run the **EVA voice assistant UI**, **live NASA telemetry (TSS + Java)**, and **optional Ollama** for natural-language commands.

**All local, no Docker, one terminal per service:** **[RUN_LOCAL.md](./RUN_LOCAL.md)**

---

## What opens in the browser

| URL | What it is |
|-----|------------|
| http://localhost:5173 | **EVA mission console** (React) — commands, telemetry, procedures |
| http://localhost:8000 | **EVA API** (FastAPI) — docs at `/docs` |
| http://localhost:14141 | **TSS control panel** — NASA sim UI (EVA/rover/LTV toggles) |
| http://localhost:7070 | **Java API** — bridge to TSS (not meant for humans) |
| http://localhost:11434 | **Ollama** (when run via Docker Compose) |

---

## Install once (on your Mac)

| Tool | Why |
|------|-----|
| [Docker Desktop](https://docs.docker.com/get-docker/) | TSS, Java, Ollama, and optional EVA API |
| **Python 3.11+** | EVA backend (local dev only) |
| **Node.js 20.19+ or 22.12+** | EVA frontend (`npm run dev`) |
| **ffmpeg** | Voice input when EVA runs locally (`brew install ffmpeg`) |
| [Ollama](https://ollama.com) | Only if you run EVA **locally** with agentic mode (not needed for all-Docker EVA) |

---

## Docker: AIA + Ollama only (TSS + Java on host)

`docker-compose.yaml` runs **only** `eva-backend` and `ollama`. Start **TSS + Java locally** first ([`RUN_TSS_JAVA_NO_DOCKER.md`](RUN_TSS_JAVA_NO_DOCKER.md)), then:

```bash
# If Java uses port 7071 (common when 7070 is busy):
EVA_JAVA_BACKEND_URL=http://host.docker.internal:7071 docker compose -f docker-compose.yaml up -d --build

# Default expects Java on host port 7070:
docker compose -f docker-compose.yaml up -d --build
```

Check:

```bash
docker compose -f docker-compose.yaml ps
curl -s http://localhost:11434/api/tags
curl -s http://localhost:8000/agent/status
# expect "agentic_enabled": true and java_backend_reachable: true
```

Then run the frontend locally:

```bash
cd frontend && npm install && npm run dev
```

**Stop:**

```bash
docker compose -f docker-compose.yaml down
```

**Full stack in Docker** (TSS + Java + everything — stop native `./server.exe` first to free UDP 14141):

```bash
docker compose -f docker-compose.full-stack.yaml up -d --build
```

---

## Step 1 — TSS + Java (no Docker)

See [`RUN_TSS_JAVA_NO_DOCKER.md`](RUN_TSS_JAVA_NO_DOCKER.md). Quick start:

```bash
curl -s http://localhost:7071/ev-telemetry/1 | head -c 120
```

Open the **TSS web UI**: http://localhost:14141

---

## Step 2 — EVA backend (local)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -c "import uvicorn; print('uvicorn OK')"
```

Use **`python -m pip`**, not bare `pip`, so Conda and the venv stay aligned. If imports fail, see **[backend/README.md](backend/README.md)** (Setup + troubleshooting).

Edit `backend/.env` if needed (see [Configuration](#configuration) below).

```bash
# Set Java IP/port on the command line (match JAVA_HTTP_PORT from JavaBackend)
python run_aia.py --reload --host 0.0.0.0 --port 8000 --java-host 127.0.0.1 --java-port 7071
```

Or use `backend/.env` only:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Check:

```bash
curl -s http://localhost:8000/health
curl -s http://localhost:8000/agent/status
curl -s http://localhost:8000/telemetry
curl -s http://localhost:8000/telemetry/full | head -c 200
```

If `/telemetry` returns **503**, TSS/Java is not reachable — fix Step 1 first.  
**`/telemetry/full`** returns the full Java mission bundle (EV1/EV2, DCU, errors, IMU, UIA, EVA state, rover, lidar, LTV) used by AIA for warnings and agentic Q&A.

---

## Step 3 — EVA frontend

New terminal:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

---

## Step 4 — Ollama (natural-language commands)

### Option A — Ollama in Docker (with `docker compose`)

Included when you start `eva-backend` (see [All-in-Docker](#all-in-docker-tss--java--ollama--eva-api)). No separate Ollama install on your Mac.

### Option B — Ollama on your Mac (local `uvicorn`)

Only when `EVA_AGENTIC_ENABLED=true` in `backend/.env` and EVA runs **outside** Docker.

1. Install Ollama from https://ollama.com and start the app.
2. `ollama pull llama3.2`
3. In `backend/.env`:

```env
EVA_AGENTIC_ENABLED=true
EVA_OLLAMA_BASE_URL=http://127.0.0.1:11434
EVA_OLLAMA_MODEL=llama3.2
```

4. Restart `uvicorn`.

Check: `curl -s http://localhost:8000/agent/status` → `"agentic_enabled": true`

With agentic on, you can ask *“what is the battery level?”* in the UI.  
With agentic **off**, use **exact** phrases (see below).

---

## Configuration (`backend/.env`)

| Variable | Typical value | Meaning |
|----------|---------------|---------|
| `EVA_LIVE_TELEMETRY` | `true` | Live Java mission telemetry into AIA |
| `EVA_JAVA_TELEMETRY_TRANSPORT` | `websocket` | `websocket` = `WS /telemetry/mission/live`; `http` = REST poll fallback |
| `EVA_JAVA_BACKEND_URL` | `http://localhost:7070` | Java API (must match `JAVA_HTTP_PORT`; use `7071` if that port is busy) |
| `EVA_DEMO_MODE` | `true` | Mission starts in `EGRESS` for demos |
| `EVA_ASR_ENABLED` | `true` | Microphone → local Whisper |
| `EVA_AGENTIC_ENABLED` | `false` or `true` | `false` = phrase list; `true` = Ollama |
| `EVA_OLLAMA_BASE_URL` | `http://127.0.0.1:11434` | Ollama HTTP API |
| `EVA_OLLAMA_MODEL` | `llama3.2` | Must match `ollama pull` name |

**Mock telemetry (no Docker):** set `EVA_LIVE_TELEMETRY=false` and restart the API.

---

## Voice / text commands

### Rule-based mode (`EVA_AGENTIC_ENABLED=false`)

Say or type these **exactly** (or very close):

| Phrase | Result |
|--------|--------|
| `battery status` | Battery readout |
| `oxygen status` | Oxygen readout |
| `co2 status` | CO₂ status |
| `what phase am i in` | Mission phase |
| `any warnings` | Active warnings |
| `help` | Supported phrases |

`UNKNOWN_COMMAND` usually means the wording is not in the list — not an Ollama problem.

### Agentic mode (`EVA_AGENTIC_ENABLED=true` + Ollama running)

Free-form questions work, e.g. *“what is the battery level?”*, *“how is my oxygen?”*

If Ollama is down you’ll see errors like **`LLM_UNAVAILABLE`**, not `UNKNOWN_COMMAND`.

---

## Optional: run more in Docker

**EVA API + Ollama in Docker** (TSS + Java on host — see top of this file):

```bash
EVA_JAVA_BACKEND_URL=http://host.docker.internal:7071 docker compose -f docker-compose.yaml up -d --build
```

Still run the React frontend locally (`npm run dev` on :5173).

**Full stack in Docker** (TSS + Java + Python nav — stop native TSS on UDP 14141 first):

```bash
docker compose -f docker-compose.full-stack.yaml up -d --build
```

**Stop everything:**

```bash
docker compose -f docker-compose.yaml down
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `GET /telemetry` → 503 | Start host TSS + Java; `curl http://localhost:7071/ev-telemetry/1`. Docker EVA: `EVA_JAVA_BACKEND_URL` must reach host Java. |
| TSS UI won’t load | Open http://localhost:14141; ensure `./server.exe` is running (not blocked by Docker `c-backend`) |
| CORS error in browser | Add your origin to `EVA_CORS_ORIGINS` in `backend/.env` |
| Mic / voice fails | Install **ffmpeg**; first transcribe downloads Whisper (slow once) |
| `UNKNOWN_COMMAND` | Use exact phrases, or enable agentic + Ollama |
| `LLM_UNAVAILABLE` | Docker: `docker compose logs ollama eva-backend`; ensure `ollama-init` finished. Local: start Ollama + `ollama pull llama3.2` |
| Commands work but telemetry stale | `curl http://localhost:8000/agent/status` → `java_backend_reachable` |

---

## Minimal checklist

- [ ] TSS + Java running on host (or full-stack compose)
- [ ] http://localhost:14141 loads (TSS)
- [ ] `curl http://localhost:7070/ev-telemetry/1` returns JSON
- [ ] EVA API on :8000, `/health` OK
- [ ] Frontend on :5173
- [ ] (Agentic) Ollama up — Docker (`ollama` service) or Mac app + `EVA_AGENTIC_ENABLED=true`

More detail: [README.md](./README.md) · [docs/EVA_README.md](./docs/EVA_README.md)
