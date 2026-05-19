import { useState, useEffect, useCallback } from "react"
import { fetchPois, fetchRoverTelemetry, fetchImu, fetchLtv } from "../api/hubClient"
import { isHubConfigured } from "../api/hubConfig"
import { mapHubPois, mapTelemetryMarkers } from "../api/mapMappers"

const POLL_MS = 1000

export function useMapLiveData() {
  const [pois, setPois] = useState([])
  const [telemetryPoints, setTelemetryPoints] = useState([])
  const [hubConnected, setHubConnected] = useState(false)
  const [hubError, setHubError] = useState(null)

  const refresh = useCallback(async () => {
    try {
      const [poiRows, rover, imu1, imu2, ltv] = await Promise.all([
        fetchPois(),
        fetchRoverTelemetry(),
        fetchImu(1),
        fetchImu(2),
        fetchLtv(),
      ])
      setPois(mapHubPois(poiRows))
      setTelemetryPoints(mapTelemetryMarkers(rover, imu1, imu2, ltv))
      setHubConnected(true)
      setHubError(null)
    } catch (err) {
      setPois([])
      setTelemetryPoints([])
      setHubConnected(false)
      setHubError(err instanceof Error ? err.message : "Hub unavailable")
    }
  }, [])

  useEffect(() => {
    // Dont poll until hub configuration is ready
    if (!isHubConfigured()) {
      setPois([])
      setTelemetryPoints([])
      setHubConnected(false)
      setHubError("Hub not configured")
      return
    }

    let cancelled = false
    async function poll() {
      if (cancelled) return
      await refresh()
    }
    poll()
    const timer = setInterval(poll, POLL_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [refresh])

  return { pois, telemetryPoints, hubConnected, hubError, refresh }
}
