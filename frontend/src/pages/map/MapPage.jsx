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
  createPoi,
  deletePoi,
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

  const handlePlacePoi = useCallback(
    async ({ x, y }) => {
      const name = `POI ${displayPois.length + 1}`
      const localId = `local-${Date.now()}`
      const optimistic = {
        id: localId,
        hubId: null,
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
        await createPoi({ name, x, y, tags: ["POI"], type: "poi" })
        setLocalPois((prev) => prev.filter((p) => p.id !== localId))
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
    if (!placingPoi) return
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setPlacingPoi(false)
        setStatusMessage("POI placement cancelled")
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [placingPoi])

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
            setPlacingPoi((p) => {
              const next = !p
              if (next) setStatusMessage("Click the map to drop a POI (Esc to cancel)")
              return next
            })
          }}
          placingPoi={placingPoi}
          onAddHazardClick={() => setShowAddHazard((p) => !p)}
          showAddHazard={showAddHazard}
        />
        <MapStage
          pois={displayPois}
          telemetryPoints={telemetryPoints}
          placingPoi={placingPoi}
          onPlacePoi={handlePlacePoi}
          onDeletePoi={handleDeletePoi}
          onNavigateToPoi={handleNavigateToPoi}
          poiPanel={showPoiPanel ? <PoiPanel pois={displayPois} onClose={() => setShowPoiPanel(false)} /> : null}
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
