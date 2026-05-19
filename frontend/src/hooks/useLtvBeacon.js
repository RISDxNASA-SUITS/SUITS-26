import { useState, useEffect, useRef } from "react"
import { ltvBeaconMock } from "../mock/ltvBeaconMock"
import { fetchLtv, fetchRoverTelemetry } from "../api/hubClient"
import { isHubConfigured } from "../api/hubConfig"
import { mapLtvBeacon } from "../api/hubMappers"

const POLL_MS = 900

/**
 * Live LTV beacon telemetry from Java Hub (/ltv + /telemetry).
 */
export function useLtvBeacon() {
  const [snap, setSnap] = useState(() => ltvBeaconMock.getSnapshot())
  const [hubConnected, setHubConnected] = useState(false)
  const [hubError, setHubError] = useState(null)
  const accRef = useRef({})

  useEffect(() => {
    // Dont poll until hub configuration is ready
    if (!isHubConfigured()) {
      setHubConnected(false)
      setHubError("Hub not configured")
      return
    }

    let cancelled = false

    async function poll() {
      try {
        const [ltv, rover] = await Promise.all([fetchLtv(), fetchRoverTelemetry()])
        if (cancelled) return
        const mapped = mapLtvBeacon(ltv, rover, accRef.current)
        accRef.current = {
          signalBars: mapped.signalBars,
          locateElapsedSeconds: mapped.locateElapsedSeconds,
        }
        setSnap(mapped)
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
  }, [])

  return { ...snap, hubConnected, hubError }
}
