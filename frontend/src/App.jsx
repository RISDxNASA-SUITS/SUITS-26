import { Navigate, Route, Routes } from "react-router-dom"
import { AlertOverlay } from "./components/eva/AlertOverlay"
import { EvaCommandDock } from "./components/eva/EvaCommandDock"
import "./components/eva/eva-overlays.css"
import { EvaAlertProvider } from "./context/EvaAlertContext"
import { DashboardPage } from "./pages/dashboard/DashboardPage"
import { MapPage } from "./pages/map/MapPage"

function App() {
  return (
    <EvaAlertProvider>
      <AlertOverlay />
      <EvaCommandDock />
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </EvaAlertProvider>
  )
}

export default App
