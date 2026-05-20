import { parseLiveTelemetry } from "./hubLiveTelemetry"

const INITIAL_BACKOFF_MS = 1000
const MAX_BACKOFF_MS = 30000

/**
 * @typedef {'connecting' | 'open' | 'closed' | 'error'} HubWsStatus
 */

/**
 * @param {string} wsUrl
 * @param {{
 *   onMessage: (payload: import('./hubLiveTelemetry').LiveTelemetryPayload) => void
 *   onStatus: (status: HubWsStatus, error?: string) => void
 * }} handlers
 */
export function connectHubWebSocket(wsUrl, { onMessage, onStatus }) {
  let ws = null
  let stopped = false
  let reconnectTimer = null
  let backoffMs = INITIAL_BACKOFF_MS

  function clearReconnectTimer() {
    if (reconnectTimer != null) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
  }

  function scheduleReconnect() {
    if (stopped) return
    clearReconnectTimer()
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null
      openSocket()
    }, backoffMs)
    backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF_MS)
  }

  function openSocket() {
    if (stopped) return
    clearReconnectTimer()
    onStatus("connecting")

    try {
      ws = new WebSocket(wsUrl)
    } catch (err) {
      onStatus("error", err instanceof Error ? err.message : "WebSocket failed")
      scheduleReconnect()
      return
    }

    ws.onopen = () => {
      backoffMs = INITIAL_BACKOFF_MS
      onStatus("open")
    }

    ws.onmessage = (event) => {
      try {
        const raw = JSON.parse(String(event.data))
        const payload = parseLiveTelemetry(raw)
        if (payload) onMessage(payload)
      } catch {
        // ignore malformed frames
      }
    }

    ws.onerror = () => {
      onStatus("error", "WebSocket error")
    }

    ws.onclose = () => {
      ws = null
      if (stopped) return
      onStatus("closed")
      scheduleReconnect()
    }
  }

  openSocket()

  return {
    close() {
      stopped = true
      clearReconnectTimer()
      if (ws) {
        const socket = ws
        ws = null
        socket.onclose = null
        socket.close()
      }
    },
  }
}
