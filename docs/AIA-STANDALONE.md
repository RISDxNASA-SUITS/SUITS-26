# AIA on a Standalone Device (Competition Setup)

This guide is for the **dedicated AIA laptop** at competition: run the EVA FastAPI service **without Docker**, connect to the **Java Hub** on another machine, and use **Ollama locally** for natural-language commands.

For the full stack (TSS, Java, Docker), see the root [RUN.md](../RUN.md).

---

## Architecture

```
[TSS + Java Hub machine]          [AIA laptop — this guide]
  Java API :7070  ◄──── HTTP ────  EVA API :8000
  (polls TSS)                       Ollama   :11434
                                    optional: Vite UI :5173
```

- **AIA must not talk to TSS directly.** It only calls the Java Hub (`EVA_JAVA_BACKEND_URL`).
- **Ollama runs on the same machine as AIA** (recommended). Do not rely on Docker for Ollama on competition day.
- The **Dashboard / Map UI** can run on this laptop or another; it reads Hub telemetry via `/hub` and EVA via `/eva` (Vite dev proxy).

---

## What you need on the AIA laptop

| Requirement | Notes |
|-------------|--------|
| **macOS or Linux** | Scripts are bash; tested on macOS. |
| **Python 3.11+** | `python3 --version` |
| **Git** | Clone this repo (branch `testdemo-aia` or your team branch). |
| **Network** | Same LAN as the Java Hub machine. |
| **Ollama** | Install **before** competition; pull the model **before** competition. |
| **ffmpeg** (optional) | Only for microphone / ASR (`EVA_ASR_ENABLED=true`). `brew install ffmpeg` on Mac. |

You do **not** need Docker on the AIA laptop for AIA itself.

---

## One-time setup (do this before competition)

### 1. Clone the repo

```bash
git clone https://github.com/RISDxNASA-SUITS/SUITS-26.git
cd SUITS-26
git checkout testdemo-aia   # or your team branch
```

### 2. Install Ollama and download the model

Install from [https://ollama.com](https://ollama.com) and start the Ollama app (or `ollama serve`).

**Download the model while you still have good internet** — do not wait until competition day:

```bash
ollama pull llama3.2
ollama list
```

Verify Ollama is running:

```bash
curl -s http://127.0.0.1:11434/api/tags
```

You should see `llama3.2` in the JSON response.

### 3. Install Python dependencies (first run only)

The start script creates a venv automatically, but you can pre-install:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 4. Use the competition environment file

```bash
cp backend/.env.competition backend/.env
```

This enables:

- `EVA_AGENTIC_ENABLED=true` — free-form questions via Ollama  
- `EVA_OLLAMA_BASE_URL=http://127.0.0.1:11434`  
- `EVA_OLLAMA_MODEL=llama3.2`  
- `EVA_LIVE_TELEMETRY=true` — poll Java Hub for real telemetry  

`EVA_JAVA_BACKEND_URL` is overwritten each time you run `aia-start.sh`.

**Fallback (no Ollama):** use rule-based commands only:

```bash
cp backend/.env.example backend/.env
```

Then only exact phrases work (e.g. `battery status`), not *“what is the battery level?”*.

---

## Competition day — start AIA

### Prerequisites on the network

1. **Java Hub is already running** on its machine (port **7070**).
2. You know that machine’s **IP address** (e.g. `192.168.1.20`).
3. **Ollama is running** on the AIA laptop (`curl http://127.0.0.1:11434/api/tags` succeeds).
4. Port **8000** is free (stop Docker `eva-backend` if it was using 8000).

### Start

From the **repo root**:

```bash
./scripts/aia-start.sh 192.168.1.20
```

Or omit the IP to be prompted:

```bash
./scripts/aia-start.sh
# Java Hub IP address: 192.168.1.20
```

You can include a custom port: `./scripts/aia-start.sh 192.168.1.20:7070`

The script will:

1. Write `EVA_JAVA_BACKEND_URL` into `backend/.env`
2. Run **preflight** — fail immediately if Hub is unreachable
3. Start **uvicorn** on `http://0.0.0.0:8000` in the background
4. Confirm `/health` and `java_backend_reachable` when live telemetry is on

Logs: `backend/.run/aia.log`

**Foreground mode** (see logs in the terminal):

```bash
./scripts/aia-start.sh 192.168.1.20 --foreground
```

### Stop

```bash
./scripts/aia-stop.sh
```

---

## Verify everything works

Run these on the **AIA laptop** after start:

```bash
# 1. Health
curl -s http://127.0.0.1:8000/health

# 2. Agent + Hub link
curl -s http://127.0.0.1:8000/agent/status
```

Expected:

```json
{
  "agentic_enabled": true,
  "live_telemetry_enabled": true,
  "java_backend_reachable": true
}
```

```bash
# 3. Rule-based command (works even if Ollama is off)
curl -s -X POST http://127.0.0.1:8000/command \
  -H 'Content-Type: application/json' \
  -d '{"text":"battery status"}'

# 4. Natural language (needs Ollama)
curl -s -X POST http://127.0.0.1:8000/command \
  -H 'Content-Type: application/json' \
  -d '{"text":"what is the battery level?"}'
```

If (4) returns `LLM_UNAVAILABLE`, Ollama is not running or the model is missing.

**Direct Hub check** (optional — run against the Java machine IP):

```bash
curl -s http://192.168.1.20:7070/ev-telemetry/1 | head -c 120
```

---

## Optional: run the React UI on the same laptop

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

- **Dashboard / Map telemetry** → Vite proxy `/hub` → Java Hub (configure Hub on the machine running Vite, or set `VITE_HUB_URL` if Hub is remote).
- **Ask EVA** → Vite proxy `/eva` → `http://127.0.0.1:8000` (AIA on this laptop).

If Vite uses port **5174** because 5173 is busy, CORS is already covered in `.env.competition`; the `/eva` proxy avoids most CORS issues.

---

## Command reference

### With Ollama (`EVA_AGENTIC_ENABLED=true`)

Free-form questions, for example:

- *“What is the battery level?”*
- *“How is my oxygen?”*
- *“Navigate to the airlock”* (demo routing)

### Without Ollama (`EVA_AGENTIC_ENABLED=false`)

Use **exact** phrases:

| Phrase | Purpose |
|--------|---------|
| `help` | List supported commands |
| `battery status` | Battery readout |
| `oxygen status` | Oxygen readout |
| `co2 status` | CO₂ readout |
| `what phase am i in` | Mission phase |
| `any warnings` | Active warnings |
| `start egress` / `next step` / `repeat step` | Procedures |

`UNKNOWN_COMMAND` means the wording is not in the list — not a Hub connection failure.

---

## Troubleshooting

| Problem | What to do |
|---------|------------|
| `Port 8000 is already in use` | `docker stop suits-26-eva-backend-1` or `./scripts/aia-stop.sh` |
| `preflight failed` / Hub unreachable | Ping Java IP; confirm Hub on 7070; fix firewall; use correct IP in `aia-start.sh` |
| `java_backend_reachable: false` | Hub down or wrong `EVA_JAVA_BACKEND_URL`; restart after Hub is up |
| `LLM_UNAVAILABLE` | Start Ollama; run `ollama pull llama3.2`; check `curl http://127.0.0.1:11434/api/tags` |
| Frontend **failed to fetch** on Ask EVA | Ensure AIA is running; restart `npm run dev` (uses `/eva` proxy); check `backend/.run/aia.log` |
| ASR / microphone fails | Install `ffmpeg`; or set `EVA_ASR_ENABLED=false` in `.env` |
| Slow first LLM reply | Normal — model load; test once before going live |

---

## Quick checklist

**Before leaving for competition**

- [ ] `ollama pull llama3.2` completed on AIA laptop  
- [ ] `cp backend/.env.competition backend/.env`  
- [ ] `./scripts/aia-start.sh <JAVA_IP>` tested on the same network you will use  
- [ ] `agent/status` shows `java_backend_reachable: true` and `agentic_enabled: true`  
- [ ] One natural-language command and one `battery status` tested  

**On competition day**

- [ ] Java Hub machine is up  
- [ ] Ollama app running on AIA laptop  
- [ ] `./scripts/aia-start.sh <JAVA_HUB_IP>`  
- [ ] Optional: `npm run dev` in `frontend/`  

---

## Related files

| File | Purpose |
|------|---------|
| `scripts/aia-start.sh` | Start AIA with Java Hub IP + preflight |
| `scripts/aia-stop.sh` | Stop background uvicorn |
| `scripts/aia-preflight.py` | Config + Hub reachability check |
| `backend/.env.competition` | Competition env template (Ollama + agentic) |
| `backend/.env.example` | Dev / rule-based fallback template |
| [RUN.md](../RUN.md) | Full project run guide (Docker, TSS, etc.) |
