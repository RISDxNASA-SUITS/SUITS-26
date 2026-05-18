import { Navigate, Route, Routes } from "react-router-dom"
import { AlertBubbles } from "./components/eva/AlertBubbles"
import { EvaCommandDock } from "./components/eva/EvaCommandDock"
import "./components/eva/eva-overlays.css"
import { DashboardPage } from "./pages/dashboard/DashboardPage"
import { MapPage } from "./pages/map/MapPage"

function App() {
  return (
    <>
      <AlertBubbles />
      <EvaCommandDock />
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App
