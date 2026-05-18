import { useState, useCallback } from "react"
import { TaskPanel } from "./components/TaskPanel"
import { MissionBar } from "./components/MissionBar"
import { MapStage } from "./components/MapStage"
import { PathOptExpanded } from "./components/PathOptExpanded"
import { PoiPanel } from "./components/PoiPanel"
import { AddPoiPanel } from "./components/AddPoiPanel"
import { AddHazardPanel } from "./components/AddHazardPanel"
import { HubStatusBanner } from "../dashboard/components/HubStatusBanner"
import { useMapLiveData } from "../../hooks/useMapLiveData"
import { deletePoi } from "../../api/hubClient"
import { startRobustNavigation } from "../../api/navClient"
import "./styles/index.css"

export function MapPage() {
  const [isManual, setIsManual] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showPoiPanel, setShowPoiPanel] = useState(false)
  const [showAddPoi, setShowAddPoi] = useState(false)
  const [showAddHazard, setShowAddHazard] = useState(false)
  const [statusMessage, setStatusMessage] = useState(null)

  const { pois, telemetryPoints, hubError, refresh } = useMapLiveData()

  const handleDeletePoi = useCallback(
    async (poi) => {
      try {
        await deletePoi(poi.hubId)
        setStatusMessage(`Deleted ${poi.label}`)
        await refresh()
      } catch (err) {
        setStatusMessage(err instanceof Error ? err.message : "Delete failed")
      }
    },
    [refresh],
  )

  const handleNavigateToPoi = useCallback(async (poi) => {
    try {
      await startRobustNavigation(poi.tssX, poi.tssY)
      setStatusMessage(`Navigation started → ${poi.label}`)
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : "Navigation failed")
    }
  }, [])

  return (
    <main className="map-page-shell">
      <TaskPanel
        isManual={isManual}
        onToggleManual={setIsManual}
        isExpanded={isExpanded}
        onToggleExpand={() => setIsExpanded(true)}
      />
      <section className="map-workspace" aria-label="Map workspace">
        <HubStatusBanner error={hubError} />
        {statusMessage && !hubError && (
          <div className="map-status-banner" role="status">
            {statusMessage}
          </div>
        )}
        <MissionBar
          onPoiClick={() => setShowPoiPanel((p) => !p)}
          showPoiPanel={showPoiPanel}
          onAddPoiClick={() => setShowAddPoi((p) => !p)}
          showAddPoi={showAddPoi}
          onAddHazardClick={() => setShowAddHazard((p) => !p)}
          showAddHazard={showAddHazard}
        />
        <MapStage
          pois={pois}
          telemetryPoints={telemetryPoints}
          onDeletePoi={handleDeletePoi}
          onNavigateToPoi={handleNavigateToPoi}
          poiPanel={showPoiPanel ? <PoiPanel pois={pois} onClose={() => setShowPoiPanel(false)} /> : null}
          addPoiPanel={showAddPoi ? <AddPoiPanel onClose={() => setShowAddPoi(false)} /> : null}
          addHazardPanel={showAddHazard ? <AddHazardPanel onClose={() => setShowAddHazard(false)} /> : null}
        />
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
