# SUITS EVA Frontend

Dashboard and map UI (React + Vite). EVA assistant overlays (command dock + alert bubbles) are app-wide on `/` and `/map`.

## Setup

```bash
cd frontend
npm install
```

Create `.env` (optional):

```env
VITE_API_ORIGIN=http://localhost:8000
```

Defaults to `http://localhost:8000` in dev when unset.

## Run

```bash
npm run dev
```

When the dev server starts, it prompts for the Java Hub IP address and port. Vite only starts after the launcher confirms it can connect to `ws://<ip>:<port>/telemetry/live`; otherwise it exits with an error.

- **Dashboard:** http://localhost:5173/
- **Map:** http://localhost:5173/map

Requires the EVA backend on port 8000 for commands, warnings, and agent alerts.

## EVA overlays

- **AIA button (bottom-right):** Opens text command input and microphone on both dashboard and map.
- **Alert bubbles (bottom-center):** Red badges for telemetry warnings and agent alerts from the backend.

## Build

```bash
npm run build
```
