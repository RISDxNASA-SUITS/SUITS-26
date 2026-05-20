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
  const [hubError, setHubError] = useState(null)

  useEffect(() => {
    if (!isHubConfigured) {
      setHubError("Hub not configured")
      return
    }

    if (wsStatus === "open") {
      setHubError(null)
    }

    let cancelled = false
    async function check() {
      try {
        await fetchEvTelemetry(1)
        if (!cancelled) setHubError(null)
      } catch (err) {
        if (!cancelled) {
          setHubError(err instanceof Error ? err.message : "Hub unavailable")
        }
      }
    }
    check()
    const timer = setInterval(check, 3000)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [isHubConfigured, hubUrl, wsStatus])

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
