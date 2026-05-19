const STORAGE_KEY = "SUITS_HUB_URL"

function normalizeUrl(url) {
  let value = String(url ?? "").trim()
  if (!value) return ""
  if (!/^https?:\/\//i.test(value)) {
    value = `http://${value}`
  }
  return value.replace(/\/+$/g, "")
}

export function getHubUrl() {
  if (typeof window === "undefined") return ""
  return normalizeUrl(window.localStorage.getItem(STORAGE_KEY) ?? "")
}

export function setHubUrl(url) {
  const normalized = normalizeUrl(url)
  if (typeof window !== "undefined") {
    if (normalized) {
      window.localStorage.setItem(STORAGE_KEY, normalized)
    } else {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }
  return normalized
}

export function isHubConfigured() {
  return Boolean(getHubUrl())
}

export function getHubBase() {
  const hubUrl = getHubUrl()
  if (hubUrl) return hubUrl
  return "/hub"
}
