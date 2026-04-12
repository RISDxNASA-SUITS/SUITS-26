import { BeaconPanel } from "./components/BeaconPanel"
import { CommsHistory } from "./components/CommsHistory"
import { EvPanel } from "./components/EvPanel"
import { SuitsPanel } from "./components/SuitsPanel"

function App() {
  return (
    <main className="dashboard-shell">
      <div className="dashboard-grid">
        <CommsHistory />
        <SuitsPanel />
        <EvPanel />
        <BeaconPanel />
      </div>
    </main>
  )
}

export default App
