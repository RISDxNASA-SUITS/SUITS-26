import { useRef, useState, useEffect } from "react"
import { BeaconPanel } from "./components/BeaconPanel"
import { CommsHistory } from "./components/CommsHistory"
import { SuitsPanel } from "./components/SuitsPanel"
import { HubStatusBanner } from "./components/HubStatusBanner"
import { fetchEvTelemetry } from "../../api/hubClient"
import { useHubConfigContext } from "../../context/HubConfigContext"
import { useViewportScale } from "../../hooks/useViewportScale"
import "./styles/index.css"

export function DashboardPage() {
  const shellRef = useRef(null)
  const scale = useViewportScale(shellRef)
  const { isHubConfigured, hubUrl, wsStatus } = useHubConfigContext()
  const [hubError, setHubError] = useState(() => {
    return !isHubConfigured ? "Hub not configured" : null
  })

  // calling setState in this effect is intentional: we only update hubError when
  // the observed external hub state changes or when the async health check reports.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!isHubConfigured) return

    if (wsStatus === "open") {
      if (hubError !== null) setHubError(null)
    }

    let cancelled = false
    async function check() {
      try {
        await fetchEvTelemetry(1)
        if (!cancelled && hubError !== null) setHubError(null)
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Hub unavailable"
          if (hubError !== msg) setHubError(msg)
        }
      }
    }
    check()
    const timer = setInterval(check, 3000)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [isHubConfigured, hubUrl, wsStatus, hubError])
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <main className="dashboard-shell" ref={shellRef} style={{ zoom: scale }}>
      <HubStatusBanner restError={hubError} />
      <div className="dashboard-grid">
        <CommsHistory />
        <SuitsPanel label="Suits 1" panelClass="suits-panel" slot="suits1" />
        <SuitsPanel label="Suits 2" panelClass="ev-panel" evLabel="EV 2" slot="suits2" />
        <BeaconPanel />
      </div>
    </main>
  )
}
