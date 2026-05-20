import { useEffect, useState } from "react"
import { TaskPanel } from "./components/TaskPanel"
import { MissionBar } from "./components/MissionBar"
import { MapStage } from "./components/MapStage"
import { PathOptExpanded } from "./components/PathOptExpanded"
import { PoiPanel } from "./components/PoiPanel"
import { AddPoiPanel } from "./components/AddPoiPanel"
import { AddHazardPanel } from "./components/AddHazardPanel"
import { createMapPoi, deleteMapPoi, updateMapPoi } from "../../api/hubClient"
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
        const currentPoi = savedPois.find((poi) => poi.id === editingPoiId)
        if (!currentPoi) return
        const updated = await updateMapPoi(currentPoi.label, {
          name: label,
          x: draftPoi.tssX,
          y: draftPoi.tssY,
          description: draftPoi.notes ?? "",
          type: draftPoi.type || "PR",
        })
        setSavedPois((prev) =>
          prev.map((poi) =>
            poi.id === editingPoiId
              ? {
                  ...poi,
                  id: updated.id ?? poi.id,
                  label: updated.name,
                  type: updated.type || draftPoi.type || "PR",
                  tssX: updated.x,
                  tssY: updated.y,
                  description: updated.description ?? draftPoi.notes ?? "",
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

      const created = await createMapPoi({
        name: label,
        x: draftPoi.tssX,
        y: draftPoi.tssY,
        description: draftPoi.notes ?? "",
        type: draftPoi.type || "PR",
      })
      setSavedPois((prev) => [
        ...prev,
        {
          id: created.id ?? `poi-${Date.now()}`,
          label: created.name,
          type: created.type || draftPoi.type || "PR",
          tssX: created.x,
          tssY: created.y,
          description: created.description ?? draftPoi.notes ?? "",
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

  async function handleDeletePoi(poiId) {
    const poi = savedPois.find((item) => item.id === poiId)
    if (!poi) return

    await deleteMapPoi(poi.label)
    setSavedPois((prev) => prev.filter((item) => item.id !== poiId))
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
