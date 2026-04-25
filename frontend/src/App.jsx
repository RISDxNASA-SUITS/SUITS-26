import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import SuitsDashboard from './pages/SuitsDashboard'
import TasksMapDashboard from './pages/TasksMapDashboard'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SuitsDashboard />} />
        <Route path="/tasks" element={<TasksMapDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
