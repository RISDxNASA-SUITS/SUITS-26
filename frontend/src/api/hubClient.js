import { getHubBase, isHubConfigured } from "./hubConfig"

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
  if (!isHubConfigured()) {
    throw new Error("Java Hub not configured")
  }

  const hubBase = getHubBase()
  const res = await fetch(`${hubBase}${path}`, {
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
  const hubBase = getHubBase()
  return fetch(`${hubBase}/poi/${id}`, { method: "DELETE" }).then((res) => {
    if (!res.ok) throw new Error(`Hub DELETE /poi/${id} failed (${res.status})`)
  })
}

/** @param {{ name: string, x: number, y: number, tags?: string[], description?: string, type?: string }} poi */
export async function createPoi(poi) {
  const body = {
    id: null,
    name: poi.name,
    x: poi.x,
    y: poi.y,
    tags: poi.tags ?? ["PR"],
    description: poi.description ?? "",
    type: poi.type ?? "poi",
    audioId: null,
    radius: null,
  }
  const res = await fetch(`${HUB_BASE}/poi`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(`Hub POST /poi failed (${res.status})`)
  }
  return res.json()
}
