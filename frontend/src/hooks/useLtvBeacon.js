import { useState, useEffect, useRef, useCallback } from "react"
import { ltvBeaconMock } from "../mock/ltvBeaconMock"
import { fetchLtv } from "../api/hubClient"
import { mapLtvBeacon } from "../api/hubMappers"
import { useHubConfigContext } from "../context/HubConfigContext"

const POLL_MS = 900

/**
 * Live LTV beacon telemetry from Java Hub (/ltv + rover via WebSocket).
 */
export function useLtvBeacon() {
  const { isHubConfigured, hubUrl, liveTelemetry } = useHubConfigContext()
  const [snap, setSnap] = useState(() => ltvBeaconMock.getSnapshot())
  const [hubConnected, setHubConnected] = useState(false)
  const [hubError, setHubError] = useState(null)
  const accRef = useRef({})
  const ltvRef = useRef(null)
  const roverRef = useRef(null)

  useEffect(() => {
    roverRef.current = liveTelemetry?.rover ?? null
  }, [liveTelemetry])

  const applyBeacon = useCallback(() => {
    if (!ltvRef.current) return
    const mapped = mapLtvBeacon(ltvRef.current, roverRef.current, accRef.current)
    accRef.current = {
      signalBars: mapped.signalBars,
      locateElapsedSeconds: mapped.locateElapsedSeconds,
    }
    setSnap(mapped)
  }, [])

  useEffect(() => {
    if (!isHubConfigured) {
      setHubConnected(false)
      setHubError("Hub not configured")
      return
    }

    let cancelled = false

    async function poll() {
      try {
        const ltv = await fetchLtv()
        if (cancelled) return
        ltvRef.current = ltv
        applyBeacon()
        setHubConnected(true)
        setHubError(null)
      } catch (err) {
        if (cancelled) return
        setHubConnected(false)
        setHubError(err instanceof Error ? err.message : "Hub unavailable")
      }
    }

    poll()
    const timer = setInterval(poll, POLL_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [isHubConfigured, hubUrl, applyBeacon])

  useEffect(() => {
    if (!isHubConfigured || !ltvRef.current) return
    applyBeacon()
  }, [liveTelemetry, isHubConfigured, applyBeacon])

  return { ...snap, hubConnected, hubError }
}
