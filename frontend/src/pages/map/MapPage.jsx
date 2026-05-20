import { useState } from "react"
import { TaskPanel } from "./components/TaskPanel"
import { MissionBar } from "./components/MissionBar"
import { MapStage } from "./components/MapStage"
import { PathOptExpanded } from "./components/PathOptExpanded"
import { PoiPanel } from "./components/PoiPanel"
import { AddPoiPanel } from "./components/AddPoiPanel"
import { AddHazardPanel } from "./components/AddHazardPanel"
import { createPoi } from "../../api/hubClient"
import { useMapLiveData } from "../../hooks/useMapLiveData"
import "./styles/index.css"

export function MapPage() {
  const [isManual, setIsManual] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showPoiPanel, setShowPoiPanel] = useState(false)
  const [placingPoi, setPlacingPoi] = useState(false)
  const [showAddHazard, setShowAddHazard] = useState(false)
  const [draftPoi, setDraftPoi] = useState(null)
  const [editingPoiId, setEditingPoiId] = useState(null)
  const [isSavingPoi, setIsSavingPoi] = useState(false)
  const [savedPois, setSavedPois] = useState([])
  const { telemetryPoints } = useMapLiveData()

  const nextPoiLabel = `POI ${savedPois.length + 1}`

  function handleAddPoiClick() {
    setShowPoiPanel(false)
    setShowAddHazard(false)
    setDraftPoi(null)
    setPlacingPoi((prev) => !prev)
  }

  function handlePoiMapPick({ x, y }) {
    setDraftPoi({
      label: nextPoiLabel,
      notes: "",
      type: "PR",
      tssX: x,
      tssY: y,
    })
  }

  function handleDraftPoiChange(patch) {
    setDraftPoi((prev) => (prev ? { ...prev, ...patch } : prev))
  }

  function handleCancelPoi() {
    setDraftPoi(null)
    setEditingPoiId(null)
    setPlacingPoi(false)
  }

  async function handleSavePoi() {
    if (!draftPoi || isSavingPoi) return

    const label = draftPoi.label.trim() || nextPoiLabel
    setIsSavingPoi(true)
    try {
      if (editingPoiId) {
        setSavedPois((prev) =>
          prev.map((poi) =>
            poi.id === editingPoiId
              ? {
                  ...poi,
                  label,
                  type: draftPoi.type || "PR",
                  tssX: draftPoi.tssX,
                  tssY: draftPoi.tssY,
                  description: draftPoi.notes ?? "",
                }
              : poi,
          ),
        )
        setDraftPoi(null)
        setEditingPoiId(null)
        setPlacingPoi(false)
        setShowPoiPanel(true)
        return
      }

      await createPoi({
        name: label,
        x: draftPoi.tssX,
        y: draftPoi.tssY,
        tags: [draftPoi.type || "PR"],
        description: draftPoi.notes ?? "",
        type: "poi",
      })
      setSavedPois((prev) => [
        ...prev,
        {
          id: `poi-${Date.now()}`,
          label,
          type: draftPoi.type || "PR",
          tssX: draftPoi.tssX,
          tssY: draftPoi.tssY,
          description: draftPoi.notes ?? "",
          active: false,
          muted: false,
        },
      ])
      setDraftPoi(null)
      setPlacingPoi(false)
      setShowPoiPanel(true)
    } catch (error) {
      console.error(error)
    } finally {
      setIsSavingPoi(false)
    }
  }

  function handleEditPoi(poi) {
    setShowPoiPanel(false)
    setShowAddHazard(false)
    setPlacingPoi(false)
    setEditingPoiId(poi.id)
    setDraftPoi({
      label: poi.label,
      notes: poi.description ?? "",
      type: poi.type || "PR",
      tssX: poi.tssX,
      tssY: poi.tssY,
    })
  }

  function handleDeletePoi(poiId) {
    setSavedPois((prev) => prev.filter((poi) => poi.id !== poiId))
    if (editingPoiId === poiId) {
      setDraftPoi(null)
      setEditingPoiId(null)
      setPlacingPoi(false)
    }
  }

  return (
    <main className="map-page-shell">
      <TaskPanel
        isManual={isManual}
        onToggleManual={setIsManual}
        isExpanded={isExpanded}
        onToggleExpand={() => setIsExpanded(true)}
      />
      <section className="map-workspace" aria-label="Map workspace">
        <MissionBar
          onPoiClick={() => setShowPoiPanel(p => !p)}
          showPoiPanel={showPoiPanel}
          onAddPoiClick={handleAddPoiClick}
          showAddPoi={placingPoi}
          onAddHazardClick={() => setShowAddHazard(p => !p)}
          showAddHazard={showAddHazard}
        />
        <MapStage
          pois={savedPois}
          telemetryPoints={telemetryPoints}
          placingPoi={placingPoi}
          onPlacePoi={handlePoiMapPick}
          onEditPoi={handleEditPoi}
          onDeletePoi={handleDeletePoi}
          poiPanel={showPoiPanel ? <PoiPanel pois={savedPois} onClose={() => setShowPoiPanel(false)} /> : null}
          addPoiPanel={(placingPoi || draftPoi) ? (
            <AddPoiPanel
              draftPoi={draftPoi}
              isEditing={Boolean(editingPoiId)}
              isSaving={isSavingPoi}
              onChange={handleDraftPoiChange}
              onCancel={handleCancelPoi}
              onSave={handleSavePoi}
            />
          ) : null}
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
