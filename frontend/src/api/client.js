function apiOrigin() {
  const raw = import.meta.env.VITE_API_ORIGIN
  const trimmed = raw?.replace(/\/$/, "")
  if (trimmed) return trimmed
  if (import.meta.env.DEV) return "http://localhost:8000"
  if (typeof window !== "undefined") return window.location.origin
  return ""
}

async function parseJson(res) {
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function getTelemetryWarnings() {
  const res = await fetch(`${apiOrigin()}/telemetry/warnings`)
  return parseJson(res)
}

export async function postCommand(body) {
  const res = await fetch(`${apiOrigin()}/command`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  return parseJson(res)
}

export async function getAgentStatus() {
  const res = await fetch(`${apiOrigin()}/agent/status`)
  return parseJson(res)
}

export async function getAgentAlerts() {
  const res = await fetch(`${apiOrigin()}/agent/alerts`)
  return parseJson(res)
}

/** Upload recorded audio to local Whisper; optional auto-route through /command pipeline. */
export async function postAsrTranscribe(blob, autoRouteToCommand = true) {
  const form = new FormData()
  form.append("audio", blob, "clip.webm")
  form.append("auto_route_to_command", autoRouteToCommand ? "true" : "false")
  const res = await fetch(`${apiOrigin()}/asr/transcribe`, {
    method: "POST",
    body: form,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.json()
}
