const HUB_BASE = (import.meta.env.VITE_HUB_URL ?? "/hub").replace(/\/$/, "")

/** WebSocket URL for live telemetry stream (e.g. /hub/telemetry/live in dev). */
export function hubTelemetryLiveWsUrl() {
  if (HUB_BASE.startsWith("http://") || HUB_BASE.startsWith("https://")) {
    const url = new URL(`${HUB_BASE}/telemetry/live`)
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:"
    return url.toString()
  }
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:"
  return `${proto}//${window.location.host}${HUB_BASE}/telemetry/live`
}

async function hubGet(path) {
  const res = await fetch(`${HUB_BASE}${path}`, {
    headers: { Accept: "application/json" },
  })
  if (!res.ok) {
    throw new Error(`Hub ${path} failed (${res.status})`)
  }
  return res.json()
}

/** @param {1 | 2} evId */
export function fetchEvTelemetry(evId) {
  return hubGet(`/ev-telemetry/${evId}`)
}

export function fetchLtv() {
  return hubGet("/ltv")
}

export function fetchRoverTelemetry() {
  return hubGet("/telemetry")
}

/** @param {1 | 2} evId */
export function fetchImu(evId) {
  return hubGet(`/imu/${evId}`)
}

export async function fetchPois() {
  const body = await hubGet("/poi")
  return body?.data ?? []
}

export function deletePoi(id) {
  return fetch(`${HUB_BASE}/poi/${id}`, { method: "DELETE" }).then((res) => {
    if (!res.ok) throw new Error(`Hub DELETE /poi/${id} failed (${res.status})`)
  })
}

async function hubPost(path, body) {
  const res = await fetch(`${HUB_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(`Hub POST ${path} failed (${res.status})`)
  }
  return res.json().catch(() => null)
}

export function setRoverThrottle(throttleInput) {
  return hubPost("/throttle", { throttleInput })
}

export function setRoverSteering(steeringInput) {
  return hubPost("/steering", { steeringInput })
}

export function setRoverBrakes(brakeInput) {
  return hubPost("/brakes", { brakeInput })
}
