import { useState } from "react"
import { TaskPanel } from "./components/TaskPanel"
import { MissionBar } from "./components/MissionBar"
import { MapStage } from "./components/MapStage"
import { PathOptExpanded } from "./components/PathOptExpanded"
import "./styles/index.css"

export function MapPage() {
  const [isManual, setIsManual] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <main className="map-page-shell">
      <TaskPanel
        isManual={isManual}
        onToggleManual={setIsManual}
        isExpanded={isExpanded}
        onToggleExpand={() => setIsExpanded(true)}
      />
      <section className="map-workspace" aria-label="Map workspace">
        <MissionBar />
        <MapStage />
      </section>
      {isExpanded && (
        <PathOptExpanded
          isManual={isManual}
          onToggleManual={setIsManual}
          onCollapse={() => setIsExpanded(false)}
        />
      )}
    </main>
  )
}
