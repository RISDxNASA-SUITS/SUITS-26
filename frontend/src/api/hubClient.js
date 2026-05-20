import { getHubBase, getHubFetchBase, isHubConfigured } from "./hubConfig"

/**
 * WebSocket URL for live telemetry stream.
 * @param {string} [base] Hub HTTP base (saved URL or dev proxy path `/hub`).
 */
export function hubTelemetryLiveWsUrl(base = getHubBase()) {
  if (base.startsWith("http://") || base.startsWith("https://")) {
    const url = new URL(`${base}/telemetry/live`)
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:"
    return url.toString()
  }
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:"
  const path = base.startsWith("/") ? base : `/${base}`
  return `${proto}//${window.location.host}${path}/telemetry/live`
}

async function hubGet(path) {
  if (!isHubConfigured()) {
    throw new Error("Java Hub not configured")
  }

  const hubBase = getHubFetchBase()
  const res = await fetch(`${hubBase}${path}`, {
    headers: { Accept: "application/json" },
  })
  if (!res.ok) {
    throw new Error(`Hub ${path} failed (${res.status})`)
  }
  return res.json()
}

async function hubPost(path, body) {
  if (!isHubConfigured()) {
    throw new Error("Java Hub not configured")
  }

  const hubBase = getHubFetchBase()
  const res = await fetch(`${hubBase}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(`Hub POST ${path} failed (${res.status})`)
  }
  return res.json().catch(() => null)
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
  const hubBase = getHubFetchBase()
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
  const hubBase = getHubFetchBase()
  const res = await fetch(`${hubBase}/poi`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(`Hub POST /poi failed (${res.status})`)
  }
  return res.json()
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
