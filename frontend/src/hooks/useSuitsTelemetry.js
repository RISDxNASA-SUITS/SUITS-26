import { useState, useEffect, useRef } from "react"
import { suitsTelemetryMock, getSuitsDerived } from "../mock/suitsTelemetryMock"
import { fetchEvTelemetry } from "../api/hubClient"
import { mapEvTelemetryToSlot } from "../api/hubMappers"
import { useHubConfigContext } from "../context/HubConfigContext"

const SLOT_TO_EV_ID = { suits1: 1, suits2: 2 }
const POLL_MS = 1000

/**
 * Live suit telemetry from Java Hub (TSS via /ev-telemetry/{1|2}).
 *
 * @param {'suits1' | 'suits2'} slot
 */
export function useSuitsTelemetry(slot = "suits1") {
  const { isHubConfigured, hubUrl } = useHubConfigContext()
  const fallback = suitsTelemetryMock.getSnapshot()[slot]
  const [data, setData] = useState(() => ({
    ...fallback,
    derived: getSuitsDerived(fallback),
  }))
  const [hubConnected, setHubConnected] = useState(false)
  const [hubError, setHubError] = useState(null)
  const accRef = useRef({})

  useEffect(() => {
    if (!isHubConfigured) {
      setHubConnected(false)
      setHubError("Hub not configured")
      return
    }

    const evId = SLOT_TO_EV_ID[slot] ?? 1
    let cancelled = false

    async function poll() {
      try {
        const raw = await fetchEvTelemetry(evId)
        if (cancelled) return
        const mapped = mapEvTelemetryToSlot(raw, accRef.current)
        accRef.current = {
          suits: mapped.suits,
          crewVitals: mapped.crewVitals,
          crewHistory: mapped.crewHistory,
        }
        setData(mapped)
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
  }, [slot, isHubConfigured, hubUrl])

  return {
    suits: data.suits,
    crewVitals: data.crewVitals,
    crewHistory: data.crewHistory,
    derived: data.derived,
    hubConnected,
    hubError,
  }
}
