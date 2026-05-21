import { useEffect, useRef, useState } from "react"
import { TaskPanel } from "./components/TaskPanel"
import { MissionBar } from "./components/MissionBar"
import { MapStage } from "./components/MapStage"
import { PathOptExpanded } from "./components/PathOptExpanded"
import { PoiPanel } from "./components/PoiPanel"
import { AddPoiPanel } from "./components/AddPoiPanel"
import { AddHazardPanel } from "./components/AddHazardPanel"
import { cancelRobustNavigation, startRobustNavigation } from "../../api/navClient"
import {
  createMapPoi,
  deleteMapPoi,
  updateMapPoi,
  setRoverBrakes,
  setRoverSteering,
  setRoverThrottle,
} from "../../api/hubClient"
import { useMapLiveData } from "../../hooks/useMapLiveData"
import "./styles/index.css"

const POI_ARRIVAL_THRESHOLD_METERS = 25

function distanceMeters(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1)
}

function formatCardinalDirection(heading) {
  const normalized = ((Number(heading) % 360) + 360) % 360
  const labels = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
  const index = Math.floor((normalized + 22.5) / 45) % 8
  return `${Math.round(normalized)} deg ${labels[index]}`
}

export function MapPage() {
  const [isManual, setIsManual] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showPoiPanel, setShowPoiPanel] = useState(false)
  const [placingPoi, setPlacingPoi] = useState(false)
  const [showAddHazard, setShowAddHazard] = useState(false)
  const [hazardLabel, setHazardLabel] = useState("")
  const [hazardNotes, setHazardNotes] = useState("")
  const [hazardLevel, setHazardLevel] = useState("warning")
  const [hazardVertices, setHazardVertices] = useState([])
  const [savedHazards, setSavedHazards] = useState([])
  const [editingHazardId, setEditingHazardId] = useState(null)
  const [draftPoi, setDraftPoi] = useState(null)
  const [editingPoiId, setEditingPoiId] = useState(null)
  const [isSavingPoi, setIsSavingPoi] = useState(false)
  const [savedPois, setSavedPois] = useState([])
  const [pathPoiIds, setPathPoiIds] = useState([])
  const [recallPoiIndex, setRecallPoiIndex] = useState(0)
  const [recallStarted, setRecallStarted] = useState(false)
  const { telemetryPoints } = useMapLiveData()
  const manualCommandRef = useRef(null)
  const manualTimerRef = useRef(null)
  const manualNavCancelledRef = useRef(false)

  useEffect(() => {
    const dockBottom = isExpanded ? "calc(1rem + 130px + 0.85rem)" : "1rem"
    document.documentElement.style.setProperty("--eva-command-dock-bottom", dockBottom)
    return () => {
      document.documentElement.style.removeProperty("--eva-command-dock-bottom")
    }
  }, [isExpanded])

  useEffect(() => {
    return () => {
      if (manualTimerRef.current) {
        window.clearInterval(manualTimerRef.current)
      }
    }
  }, [])

  const nextPoiLabel = `POI ${savedPois.length + 1}`
  const nextHazardLabel = `Hazard ${savedHazards.length + 1}`
  const pathPois = pathPoiIds
    .map((id) => savedPois.find((poi) => poi.id === id))
    .filter(Boolean)
  const availablePathPois = savedPois.filter((poi) => !pathPoiIds.includes(poi.id))
  const prPoint = telemetryPoints.find((point) => point.id === "pr")

  useEffect(() => {
    setPathPoiIds((prev) => prev.filter((id) => savedPois.some((poi) => poi.id === id)))
  }, [savedPois])

  useEffect(() => {
    setRecallPoiIndex((prev) => {
      if (!pathPois.length) return 0
      return Math.min(prev, pathPois.length - 1)
    })

    if (!pathPois.length) {
      setRecallStarted(false)
    }
  }, [pathPois])

  async function applyManualCommand(command) {
    if (command === "forward") {
      await Promise.all([
        setRoverBrakes(0),
        setRoverSteering(0),
        setRoverThrottle(35),
      ])
      return
    }

    if (command === "left") {
      await Promise.all([
        setRoverBrakes(0),
        setRoverThrottle(20),
        setRoverSteering(-1),
      ])
      return
    }

    if (command === "right") {
      await Promise.all([
        setRoverBrakes(0),
        setRoverThrottle(20),
        setRoverSteering(1),
      ])
      return
    }

    if (command === "reverse") {
      await Promise.all([
        setRoverBrakes(0),
        setRoverSteering(0),
        setRoverThrottle(-20),
      ])
    }
  }

  async function sendManualNeutral() {
    await Promise.all([
      setRoverThrottle(0),
      setRoverSteering(0),
      setRoverBrakes(0),
    ])
  }

  function clearManualTimer() {
    if (manualTimerRef.current) {
      window.clearInterval(manualTimerRef.current)
      manualTimerRef.current = null
    }
  }

  function handleManualCommandStart(command) {
    manualCommandRef.current = command
    clearManualTimer()

    const startLoop = () => {
      applyManualCommand(command).catch(console.error)
      manualTimerRef.current = window.setInterval(() => {
        if (!manualCommandRef.current) return
        applyManualCommand(manualCommandRef.current).catch(console.error)
      }, 250)
    }

    if (!manualNavCancelledRef.current) {
      manualNavCancelledRef.current = true
      cancelRobustNavigation().catch(console.error).finally(startLoop)
      return
    }

    startLoop()
  }

  function handleManualCommandEnd() {
    manualCommandRef.current = null
    clearManualTimer()
    sendManualNeutral().catch(console.error)
  }

  function handleManualStop() {
    manualCommandRef.current = null
    clearManualTimer()
    Promise.all([
      setRoverThrottle(0),
      setRoverSteering(0),
      setRoverBrakes(1),
    ]).catch(console.error)
  }

  function handleToggleManual(nextManual) {
    setIsManual(nextManual)
    if (nextManual) {
      manualNavCancelledRef.current = true
      cancelRobustNavigation().catch(console.error)
      return
    }
    manualNavCancelledRef.current = false
  }

  function handleAddPoiClick() {
    setShowPoiPanel(false)
    setShowAddHazard(false)
    setHazardVertices([])
    setDraftPoi(null)
    setEditingPoiId(null)
    setPlacingPoi((prev) => !prev)
  }

  function handleAddHazardClick() {
    setShowPoiPanel(false)
    setDraftPoi(null)
    setEditingPoiId(null)
    setPlacingPoi(false)
    setShowAddHazard((prev) => {
      const next = !prev
      if (next) {
        setHazardVertices([])
        setHazardLabel(nextHazardLabel)
        setHazardNotes("")
        setHazardLevel("warning")
        setEditingHazardId(null)
      }
      return next
    })
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

  function handleCancelHazard() {
    setShowAddHazard(false)
    setHazardVertices([])
    setHazardLabel("")
    setHazardNotes("")
    setHazardLevel("warning")
    setEditingHazardId(null)
  }

  function handleDeleteHazard() {
    if (editingHazardId) {
      setSavedHazards((hazards) => hazards.filter((hazard) => hazard.id !== editingHazardId))
      handleCancelHazard()
      return
    }

    setHazardVertices([])
    setHazardNotes("")
  }

  function handlePlaceHazard({ x, y }) {
    setHazardVertices((prev) => {
      if (prev.length >= 3) {
        const first = prev[0]
        const closeDistance = Math.hypot(x - first.x, y - first.y)

        if (closeDistance <= 25) {
          const name = hazardLabel.trim() || nextHazardLabel
          const hazardId = editingHazardId ?? `hazard-${Date.now()}`
          setSavedHazards((hazards) => {
            const nextHazard = {
              id: hazardId,
              name,
              label: name,
              notes: hazardNotes,
              level: hazardLevel,
              vertices: prev,
            }
            if (editingHazardId) {
              return hazards.map((hazard) => (hazard.id === editingHazardId ? nextHazard : hazard))
            }
            return [...hazards, nextHazard]
          })
          setShowAddHazard(false)
          setHazardVertices([])
          setHazardLabel("")
          setHazardNotes("")
          setHazardLevel("warning")
          setEditingHazardId(null)
          return []
        }
      }

      return [...prev, { x, y }]
    })
  }

  function handleEditHazard(hazardId) {
    const hazard = savedHazards.find((item) => item.id === hazardId)
    if (!hazard) return

    setShowPoiPanel(false)
    setDraftPoi(null)
    setEditingPoiId(null)
    setPlacingPoi(false)
    setEditingHazardId(hazardId)
    setHazardLabel(hazard.label ?? hazard.name)
    setHazardNotes(hazard.notes ?? "")
    setHazardLevel(hazard.level ?? "warning")
    setHazardVertices(hazard.vertices.map((vertex) => ({ ...vertex })))
    setShowAddHazard(true)
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

  function handleDeletePathPoi(poiId) {
    setRecallStarted(false)
    setRecallPoiIndex(0)
    setPathPoiIds((prev) => prev.filter((id) => id !== poiId))
  }

  function handleAddPoiToPath(poiId) {
    setRecallStarted(false)
    setRecallPoiIndex(0)
    setPathPoiIds((prev) => (prev.includes(poiId) ? prev : [...prev, poiId]))
  }

  async function handleRecallPr() {
    if (!pathPois.length) return

    let nextIndex = recallStarted ? recallPoiIndex : 0
    const livePrPoint = telemetryPoints.find((point) => point.id === "pr")
    const activePoi = pathPois[nextIndex]

    if (
      recallStarted &&
      livePrPoint &&
      activePoi &&
      Number.isFinite(livePrPoint.x) &&
      Number.isFinite(livePrPoint.y) &&
      Number.isFinite(activePoi.tssX) &&
      Number.isFinite(activePoi.tssY)
    ) {
      const arrivalDistance = distanceMeters(
        livePrPoint.x,
        livePrPoint.y,
        activePoi.tssX,
        activePoi.tssY,
      )

      if (arrivalDistance <= POI_ARRIVAL_THRESHOLD_METERS && nextIndex < pathPois.length - 1) {
        nextIndex += 1
      }
    }

    const targetPoi = pathPois[nextIndex]
    if (!targetPoi) return

    await startRobustNavigation(targetPoi.tssX, targetPoi.tssY)
    setRecallStarted(true)
    setRecallPoiIndex(nextIndex)
  }

  function handleReorderPathPoi(draggedPoiId, targetPoiId) {
    if (!draggedPoiId || !targetPoiId || draggedPoiId === targetPoiId) return

    setPathPoiIds((prev) => {
      const fromIndex = prev.indexOf(draggedPoiId)
      const toIndex = prev.indexOf(targetPoiId)
      if (fromIndex === -1 || toIndex === -1) return prev

      const next = [...prev]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })

    setRecallStarted(false)
    setRecallPoiIndex(0)
  }

  return (
    <main className="map-page-shell">
      <div className="map-page-scale-frame">
        <TaskPanel
          isManual={isManual}
          onToggleManual={handleToggleManual}
          isExpanded={isExpanded}
          onToggleExpand={() => setIsExpanded(true)}
          onManualCommandStart={handleManualCommandStart}
          onManualCommandEnd={handleManualCommandEnd}
          onManualStop={handleManualStop}
        />
        <section className="map-workspace" aria-label="Map workspace">
          <MissionBar
            onPoiClick={() => setShowPoiPanel((prev) => !prev)}
            showPoiPanel={showPoiPanel}
            onAddPoiClick={handleAddPoiClick}
            showAddPoi={placingPoi}
            onAddHazardClick={handleAddHazardClick}
            showAddHazard={showAddHazard}
            prSpeed={prPoint?.speed}
            prDirection={formatCardinalDirection(prPoint?.heading ?? 0)}
          />
          <MapStage
            pois={savedPois}
            pathPois={pathPois}
            telemetryPoints={telemetryPoints}
            placingPoi={placingPoi}
            placingHazard={showAddHazard}
            hazards={savedHazards.filter((hazard) => hazard.id !== editingHazardId)}
            hazardPreview={
              showAddHazard
                ? {
                    label: hazardLabel.trim() || nextHazardLabel,
                    level: hazardLevel,
                    vertices: hazardVertices,
                  }
                : null
            }
            onPlacePoi={handlePoiMapPick}
            onPlaceHazard={handlePlaceHazard}
            onEditPoi={handleEditPoi}
            onDeletePoi={handleDeletePoi}
            onEditHazard={handleEditHazard}
            poiPanel={showPoiPanel ? <PoiPanel pois={savedPois} /> : null}
            addPoiPanel={
              placingPoi || draftPoi ? (
                <AddPoiPanel
                  draftPoi={draftPoi}
                  isEditing={Boolean(editingPoiId)}
                  isSaving={isSavingPoi}
                  onChange={handleDraftPoiChange}
                  onCancel={handleCancelPoi}
                  onSave={handleSavePoi}
                />
              ) : null
            }
            addHazardPanel={
              showAddHazard ? (
                <AddHazardPanel
                  label={hazardLabel}
                  notes={hazardNotes}
                  level={hazardLevel}
                  isEditing={Boolean(editingHazardId)}
                  onLabelChange={setHazardLabel}
                  onNotesChange={setHazardNotes}
                  onLevelChange={setHazardLevel}
                  onDelete={handleDeleteHazard}
                  onClose={handleCancelHazard}
                />
              ) : null
            }
          />
        </section>
        {isExpanded && (
          <PathOptExpanded
            isManual={isManual}
            onToggleManual={handleToggleManual}
            onCollapse={() => setIsExpanded(false)}
            pois={pathPois}
            activePoiIndex={recallPoiIndex}
            recallStarted={recallStarted}
            availablePois={availablePathPois}
            onAddPoi={handleAddPoiToPath}
            onDeletePoi={handleDeletePathPoi}
            onReorderPoi={handleReorderPathPoi}
            onRecallPr={handleRecallPr}
          />
        )}
      </div>
    </main>
  )
}
