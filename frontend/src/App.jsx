import { Navigate, Route, Routes } from "react-router-dom"
import { DashboardPage } from "./pages/dashboard/DashboardPage"
import { MapPage } from "./pages/map/MapPage"

function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/map" element={<MapPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
