import { useState, useEffect, useRef } from "react"
import { ltvBeaconMock } from "../mock/ltvBeaconMock"
import { fetchLtv, fetchRoverTelemetry } from "../api/hubClient"
import { mapLtvBeacon } from "../api/hubMappers"

const POLL_MS = 900

function formatHms(totalMs) {
  const totalSec = Math.max(0, Math.floor(totalMs / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n))
}

/**
 * Live LTV beacon telemetry from Java Hub (/ltv + /telemetry).
 */
export function useLtvBeacon() {
  const [snap, setSnap] = useState(() => ({
    ...ltvBeaconMock.getSnapshot(),
    locateElapsedSeconds: 0,
    formattedDuration: "00:00:00",
  }))
  const [hubConnected, setHubConnected] = useState(false)
  const [hubError, setHubError] = useState(null)
  const accRef = useRef({})
  const startedAtRef = useRef(Date.now())

  useEffect(() => {
    const timer = setInterval(() => {
      const elapsedMs = Date.now() - startedAtRef.current
      setSnap((prev) => ({
        ...prev,
        locateElapsedSeconds: Math.floor(elapsedMs / 1000),
        formattedDuration: formatHms(elapsedMs),
      }))
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function poll() {
      try {
        const [ltv, rover] = await Promise.all([fetchLtv(), fetchRoverTelemetry()])
        if (cancelled) return
        const mapped = mapLtvBeacon(ltv, rover, accRef.current)
        const elapsedMs = Date.now() - startedAtRef.current
        const maxDistanceM = Math.max(
          Number(accRef.current.maxDistanceM) || 0,
          Number(mapped.distanceM) || 0,
        )
        const distanceTrackPct =
          maxDistanceM > 0
            ? clamp(((maxDistanceM - mapped.distanceM) / maxDistanceM) * 100, 0, 100)
            : 0
        const withSessionDuration = {
          ...mapped,
          locateElapsedSeconds: Math.floor(elapsedMs / 1000),
          formattedDuration: formatHms(elapsedMs),
          maxDistanceM,
          distanceTrackPct,
          distanceTrackStartLabel: maxDistanceM > 0 ? `${Math.round(maxDistanceM)} m` : "--",
          distanceTrackEndLabel: "0 m",
        }
        accRef.current = {
          signalBars: withSessionDuration.signalBars,
          maxDistanceM: withSessionDuration.maxDistanceM,
        }
        setSnap(withSessionDuration)
        setHubConnected(true)
        setHubError(null)
      } catch (err) {
        if (cancelled) return
        setHubConnected(false)
        setHubError(err instanceof Error ? err.message : "Hub unavailable")
      }
    }

    poll()
    const pollTimer = setInterval(poll, POLL_MS)
    return () => {
      cancelled = true
      clearInterval(pollTimer)
    }
  }, [])

  return { ...snap, hubConnected, hubError }
}
