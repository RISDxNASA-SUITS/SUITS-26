import { useState, useCallback, useEffect, useMemo, useRef } from "react"
import { TaskPanel } from "./components/TaskPanel"
import { MissionBar } from "./components/MissionBar"
import { MapStage } from "./components/MapStage"
import { PathOptExpanded } from "./components/PathOptExpanded"
import { PoiPanel } from "./components/PoiPanel"
import { AddHazardPanel } from "./components/AddHazardPanel"
import { HubStatusBanner } from "../dashboard/components/HubStatusBanner"
import { useMapLiveData } from "../../hooks/useMapLiveData"
import {
  createHazard,
  createPoi,
  deletePoi,
  fetchHazards,
  setRoverBrakes,
  setRoverSteering,
  setRoverThrottle,
} from "../../api/hubClient"
import { startRobustNavigation } from "../../api/navClient"
import { formatTssCoords } from "./utils/coordinates"
import "./styles/index.css"

const MANUAL_COMMANDS = {
  forward: { throttle: 35, steering: 0, brake: 0 },
  left: { throttle: 22, steering: -0.55, brake: 0 },
  right: { throttle: 22, steering: 0.55, brake: 0 },
  reverse: { throttle: 0, steering: 0, brake: 1 },
}

export function MapPage() {
  const [isManual, setIsManual] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showPoiPanel, setShowPoiPanel] = useState(false)
  const [placingPoi, setPlacingPoi] = useState(false)
  const [showAddHazard, setShowAddHazard] = useState(false)
  const [hazardLabel, setHazardLabel] = useState("")
  const [hazardLevel, setHazardLevel] = useState("warning")
  const [hazardVertices, setHazardVertices] = useState([])
  const [savedHazard, setSavedHazard] = useState(null)
  const [hazards, setHazards] = useState([])
  const [statusMessage, setStatusMessage] = useState(null)
  const [localPois, setLocalPois] = useState([])
  const manualIntervalRef = useRef(null)

  const { pois, telemetryPoints, hubError, refresh } = useMapLiveData()

  const sendManualControl = useCallback(async ({ throttle, steering, brake }) => {
    await Promise.all([
      setRoverBrakes(brake),
      setRoverSteering(steering),
      setRoverThrottle(throttle),
    ])
  }, [])

  const stopManualControl = useCallback(async () => {
    try {
      await sendManualControl({
        throttle: 0,
        steering: 0,
        brake: 1,
      })
    } catch (err) {
      console.error(err)
    }
  }, [sendManualControl])

  const clearManualInterval = useCallback(() => {
    if (manualIntervalRef.current !== null) {
      window.clearInterval(manualIntervalRef.current)
      manualIntervalRef.current = null
    }
  }, [])

  const handleManualCommandStart = useCallback(async (command) => {
    const control = MANUAL_COMMANDS[command]
    if (!control) return
    clearManualInterval()
    try {
      await sendManualControl(control)
      manualIntervalRef.current = window.setInterval(() => {
        void sendManualControl(control).catch((err) => {
          console.error(err)
        })
      }, 250)
    } catch (err) {
      console.error(err)
    }
  }, [clearManualInterval, sendManualControl])

  const handleManualCommandEnd = useCallback(() => {
    clearManualInterval()
    void stopManualControl()
  }, [clearManualInterval, stopManualControl])

  const displayPois = useMemo(() => {
    const hubIds = new Set(pois.map((p) => p.id))
    const locals = localPois.filter((p) => !hubIds.has(p.id))
    return [...pois, ...locals]
  }, [pois, localPois])

  useEffect(() => {
    if (!pois.length) return
    setLocalPois((prev) =>
      prev.filter((local) => {
        const persistedMatch = pois.some(
          (poi) =>
            String(poi.id) === String(local.pendingHubId) ||
            poi.label === local.label ||
            (poi.tssX === local.tssX && poi.tssY === local.tssY),
        )
        return !persistedMatch
      }),
    )
  }, [pois])

  const handleDeletePoi = useCallback(
    async (poi) => {
      if (!poi.hubId) {
        setLocalPois((prev) => prev.filter((p) => p.id !== poi.id))
        setStatusMessage(`Removed ${poi.label}`)
        return
      }
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

  const closeHazardMode = useCallback(() => {
    setShowAddHazard(false)
    setHazardVertices([])
    setHazardLabel("")
    setHazardLevel("warning")
    setStatusMessage("Hazard placement cancelled")
  }, [])

  const resetHazardVertices = useCallback(() => {
    setHazardVertices([])
    setStatusMessage("Hazard vertices reset")
  }, [])

  const handlePlaceHazard = useCallback(
    ({ x, y, lngLat }) => {
      setHazardVertices((prev) => {
        const next = [...prev, { x, y, lngLat }]
        setStatusMessage(`Added vertex ${next.length} at ${formatTssCoords(x, y)}`)
        return next
      })
    },
    [formatTssCoords],
  )

  const refreshHazards = useCallback(async () => {
    try {
      const hazardRows = await fetchHazards()
      setHazards(hazardRows ?? [])
    } catch (err) {
      console.error(err)
      setStatusMessage("Unable to load backend hazards")
    }
  }, [])

  const handleDoneHazard = useCallback(async () => {
    if (hazardVertices.length < 3) {
      setStatusMessage("Add at least 3 vertices to create a hazard")
      return
    }
    const name = hazardLabel.trim() || `Hazard ${hazards.length + 1}`
    const requestVertices = hazardVertices.map(({ x, y }) => ({ x, y }))
    const saved = { name, level: hazardLevel, vertices: hazardVertices }
    try {
      await createHazard({ name, level: hazardLevel, vertices: requestVertices })
      setHazards((prev) => [
        ...prev.filter((hazard) => hazard.name !== name),
        { name, level: hazardLevel, vertices: hazardVertices },
      ])
      setSavedHazard(saved)
      setShowAddHazard(false)
      setHazardVertices([])
      setHazardLabel("")
      setHazardLevel("warning")
      setStatusMessage(`Hazard ${name} added`)
      await refreshHazards()
    } catch (err) {
      console.error(err)
      setStatusMessage("Failed to save hazard. Check that the Java backend is running.")
    }
  }, [hazardLabel, hazardLevel, hazardVertices, hazards.length, refreshHazards])

  const hazardDisplayList = useMemo(() => {
    if (savedHazard && !hazards.some((hazard) => hazard.name === savedHazard.name)) {
      return [...hazards, savedHazard]
    }
    return hazards
  }, [hazards, savedHazard])

  const handlePlacePoi = useCallback(
    async ({ x, y }) => {
      const name = `POI ${displayPois.length + 1}`
      const localId = `local-${Date.now()}`
      const optimistic = {
        id: localId,
        hubId: null,
        pendingHubId: null,
        label: name,
        type: "POI",
        tssX: x,
        tssY: y,
        description: "",
        active: false,
        muted: false,
        breadcrumbStyle: true,
      }
      setLocalPois((prev) => [...prev, optimistic])
      setStatusMessage(`Placed ${name} at ${formatTssCoords(x, y)}`)

      try {
        const savedPoi = await createPoi({ name, x, y, tags: ["POI"], type: "poi" })
        setLocalPois((prev) =>
          prev.map((p) => (p.id === localId ? { ...p, pendingHubId: savedPoi.id } : p)),
        )
        await refresh()
      } catch {
        setStatusMessage(
          `${name} on map — hub save failed (start Java backend on :7070 to persist)`,
        )
      }
    },
    [displayPois.length, refresh],
  )

  useEffect(() => {
    if (!placingPoi && !showAddHazard) return
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        if (placingPoi) {
          setPlacingPoi(false)
          setStatusMessage("POI placement cancelled")
        }
        if (showAddHazard) {
          closeHazardMode()
        }
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [placingPoi, showAddHazard, closeHazardMode])

  useEffect(() => {
    void refreshHazards()
  }, [refreshHazards])

  useEffect(() => {
    if (!savedHazard) return
    if (hazards.some((hazard) => hazard.name === savedHazard.name)) {
      setSavedHazard(null)
    }
  }, [hazards, savedHazard])

  useEffect(() => {
    if (!isManual) return undefined
    return () => {
      clearManualInterval()
      void stopManualControl()
    }
  }, [clearManualInterval, isManual, stopManualControl])

  return (
    <main className="map-page-shell">
      <TaskPanel
        isManual={isManual}
        onToggleManual={setIsManual}
        isExpanded={isExpanded}
        onToggleExpand={() => setIsExpanded(true)}
        onManualCommandStart={handleManualCommandStart}
        onManualCommandEnd={handleManualCommandEnd}
        onManualStop={stopManualControl}
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
          onAddPoiClick={() => {
            setShowAddHazard(false)
            setPlacingPoi((p) => {
              const next = !p
              if (next) setStatusMessage("Click the map to drop a POI (Esc to cancel)")
              return next
            })
          }}
          placingPoi={placingPoi}
          onAddHazardClick={() => {
            setPlacingPoi(false)
            setShowAddHazard((p) => {
              const next = !p
              if (next) {
                setHazardVertices([])
                setHazardLabel("")
                setHazardLevel("warning")
                setStatusMessage("Click the map to add hazard vertices (Esc to cancel)")
              }
              return next
            })
          }}
          showAddHazard={showAddHazard}
        />
        <MapStage
          pois={displayPois}
          telemetryPoints={telemetryPoints}
          placingPoi={placingPoi}
          placingHazard={showAddHazard}
          hazards={hazardDisplayList}
          hazardPreview={showAddHazard ? { label: hazardLabel, level: hazardLevel, vertices: hazardVertices } : null}
          onPlacePoi={handlePlacePoi}
          onPlaceHazard={handlePlaceHazard}
          onDeletePoi={handleDeletePoi}
          onNavigateToPoi={handleNavigateToPoi}
          poiPanel={showPoiPanel ? <PoiPanel pois={displayPois} onClose={() => setShowPoiPanel(false)} /> : null}
          addHazardPanel={showAddHazard ? (
            <AddHazardPanel
              label={hazardLabel}
              level={hazardLevel}
              onLabelChange={setHazardLabel}
              onLevelChange={setHazardLevel}
              vertices={hazardVertices}
              onClose={closeHazardMode}
              onReset={resetHazardVertices}
              onDone={handleDoneHazard}
            />
          ) : null}
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
