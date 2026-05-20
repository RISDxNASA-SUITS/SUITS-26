import { useState, useEffect, useCallback, useRef } from "react"
import { fetchPois, fetchImu, fetchLtv } from "../api/hubClient"
import { mapHubPois, mapTelemetryMarkers } from "../api/mapMappers"
import { useHubConfigContext } from "../context/HubConfigContext"

const POLL_MS = 1000

export function useMapLiveData() {
  const { isHubConfigured, hubUrl, liveTelemetry } = useHubConfigContext()
  const [pois, setPois] = useState([])
  const [telemetryPoints, setTelemetryPoints] = useState([])
  const [hubConnected, setHubConnected] = useState(false)
  const [hubError, setHubError] = useState(null)
  const restRef = useRef({ imu1: null, imu2: null, ltv: null })
  const roverRef = useRef(null)

  useEffect(() => {
    roverRef.current = liveTelemetry?.rover ?? null
  }, [liveTelemetry])

  const applyMarkers = useCallback(() => {
    const { imu1, imu2, ltv } = restRef.current
    setTelemetryPoints(mapTelemetryMarkers(roverRef.current, imu1, imu2, ltv))
  }, [])

  const refresh = useCallback(async () => {
    try {
      const [poiRows, imu1, imu2, ltv] = await Promise.all([
        fetchPois(),
        fetchImu(1),
        fetchImu(2),
        fetchLtv(),
      ])
      restRef.current = { imu1, imu2, ltv }
      setPois(mapHubPois(poiRows))
      applyMarkers()
      setHubConnected(true)
      setHubError(null)
    } catch (err) {
      setPois([])
      setTelemetryPoints([])
      setHubConnected(false)
      setHubError(err instanceof Error ? err.message : "Hub unavailable")
    }
  }, [applyMarkers])

  useEffect(() => {
    if (!isHubConfigured) {
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
  }, [isHubConfigured, hubUrl, refresh])

  useEffect(() => {
    if (!isHubConfigured) return
    applyMarkers()
  }, [liveTelemetry, isHubConfigured, applyMarkers])

  return { pois, telemetryPoints, hubConnected, hubError, refresh }
}
