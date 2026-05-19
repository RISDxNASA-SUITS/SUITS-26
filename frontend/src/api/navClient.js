const NAV_BASE = (import.meta.env.VITE_NAV_URL ?? "/nav").replace(/\/$/, "")

export async function startRobustNavigation(x, y) {
  const res = await fetch(`${NAV_BASE}/navigate_robust`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ x, y }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data?.error ?? `Navigation failed (${res.status})`)
  }
  return data
}

export async function cancelRobustNavigation() {
  const res = await fetch(`${NAV_BASE}/navigate_robust/cancel`, { method: "POST" })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data?.error ?? `Cancel navigation failed (${res.status})`)
  }
  return data
}

export async function fetchNavigationState() {
  const res = await fetch(`${NAV_BASE}/navigation_state_robust`, {
    headers: { Accept: "application/json" },
  })
  if (!res.ok) throw new Error(`Navigation state failed (${res.status})`)
  return res.json()
}
