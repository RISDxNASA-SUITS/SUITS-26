import { useState, useEffect, useRef, useCallback } from "react"
import { ltvBeaconMock } from "../mock/ltvBeaconMock"
import { fetchLtv } from "../api/hubClient"
import { mapLtvBeacon } from "../api/hubMappers"
import { useHubConfigContext } from "../context/HubConfigContext"

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
 * Live LTV beacon telemetry from Java Hub (/ltv + rover via WebSocket).
 */
export function useLtvBeacon() {
  const { isHubConfigured, hubUrl, liveTelemetry } = useHubConfigContext()
  const [snap, setSnap] = useState(() => ({
    ...ltvBeaconMock.getSnapshot(),
    locateElapsedSeconds: 0,
    formattedDuration: "00:00:00",
  }))
  const [hubConnected, setHubConnected] = useState(false)
  const [hubError, setHubError] = useState(null)
  const accRef = useRef({})
  const ltvRef = useRef(null)
  const roverRef = useRef(null)
  const startedAtRef = useRef(Date.now())

  useEffect(() => {
    roverRef.current = liveTelemetry?.rover ?? null
  }, [liveTelemetry])

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

  const applyBeacon = useCallback(() => {
    if (!ltvRef.current) return
    const mapped = mapLtvBeacon(ltvRef.current, roverRef.current, accRef.current)
    const elapsedMs = Date.now() - startedAtRef.current
    const maxDistanceM = Math.max(
      Number(accRef.current.maxDistanceM) || 0,
      Number(mapped.distanceM) || 0,
    )
    const distanceTrackPct =
      maxDistanceM > 0
        ? clamp(((maxDistanceM - mapped.distanceM) / maxDistanceM) * 100, 0, 100)
        : 0
    const withSession = {
      ...mapped,
      locateElapsedSeconds: Math.floor(elapsedMs / 1000),
      formattedDuration: formatHms(elapsedMs),
      maxDistanceM,
      distanceTrackPct,
      distanceTrackStartLabel: maxDistanceM > 0 ? `${Math.round(maxDistanceM)} m` : "--",
      distanceTrackEndLabel: "0 m",
    }
    accRef.current = {
      signalBars: withSession.signalBars,
      maxDistanceM: withSession.maxDistanceM,
    }
    setSnap(withSession)
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
    const pollTimer = setInterval(poll, POLL_MS)
    return () => {
      cancelled = true
      clearInterval(pollTimer)
    }
  }, [isHubConfigured, hubUrl, applyBeacon])

  useEffect(() => {
    if (!isHubConfigured || !ltvRef.current) return
    applyBeacon()
  }, [liveTelemetry, isHubConfigured, applyBeacon])

  return { ...snap, hubConnected, hubError }
}
