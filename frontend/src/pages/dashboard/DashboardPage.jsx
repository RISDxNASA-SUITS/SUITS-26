import { useRef } from "react"
import { BeaconPanel } from "./components/BeaconPanel"
import { CommsHistory } from "./components/CommsHistory"
import { SuitsPanel } from "./components/SuitsPanel"
import { useViewportScale } from "../../hooks/useViewportScale"
import "./styles/index.css"

export function DashboardPage() {
  const shellRef = useRef(null)
  const scale = useViewportScale(shellRef)

  return (
    <main className="dashboard-shell" ref={shellRef} style={{ zoom: scale }}>
      <div className="dashboard-grid">
        <CommsHistory />
        <SuitsPanel label="Suits 1" panelClass="suits-panel" slot="suits1" />
        <SuitsPanel label="Suits 2" panelClass="ev-panel" evLabel="EV 2" slot="suits2" />
        <BeaconPanel />
      </div>
    </main>
  )
}
