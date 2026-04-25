import { BeaconPanel } from "./components/BeaconPanel"
import { CommsHistory } from "./components/CommsHistory"
import { SuitsPanel } from "./components/SuitsPanel"
import "./styles/index.css"

export function DashboardPage() {
  return (
    <main className="dashboard-shell">
      <div className="dashboard-grid">
        <CommsHistory />
        <SuitsPanel label="Suits 1" panelClass="suits-panel" />
        <SuitsPanel label="Suits 2" panelClass="ev-panel" evLabel="EV 2" />
        <BeaconPanel />
      </div>
    </main>
  )
}
