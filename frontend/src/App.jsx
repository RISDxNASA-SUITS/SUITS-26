import { useMemo, useState } from "react"
import { Navigate, Route, Routes } from "react-router-dom"
// AlertOverlay moved to MapPage so notifications show only on the map route
import { EvaCommandDock } from "./components/eva/EvaCommandDock"
import "./components/eva/eva-overlays.css"
import { EvaAlertProvider } from "./context/EvaAlertContext"
import { HubConfigProvider } from "./context/HubConfigContext"
import { DashboardPage } from "./pages/dashboard/DashboardPage"
import { MapPage } from "./pages/map/MapPage"
import { HubIpPrompt } from "./components/HubIpPrompt"
import { getHubUrl } from "./api/hubConfig"

function App() {
  const initialHubUrl = useMemo(() => getHubUrl(), [])
  const [showHubPrompt, setShowHubPrompt] = useState(!initialHubUrl)

  const handlePromptDismiss = () => {
    setShowHubPrompt(false)
  }

  return (
    <HubConfigProvider>
      <EvaAlertProvider>
        <EvaCommandDock />
        <HubIpPrompt open={showHubPrompt} onDismiss={handlePromptDismiss} />
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </EvaAlertProvider>
    </HubConfigProvider>
  )
}

export default App
