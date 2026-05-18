const HUB_BASE = (import.meta.env.VITE_HUB_URL ?? "/hub").replace(/\/$/, "")

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
