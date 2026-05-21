import { useState } from "react"
import { createPortal } from "react-dom"
import pathOptIcon from "../../../assets/map/Path_opt.svg"
import chevronRightIcon from "../../../assets/map/Chevron_Right.svg"
import poiArrow from "../../../assets/map/POI-arrow.png"
import addPlusCircle from "../../../assets/map/Add_Plus_Circle.png"
import editIcon from "../../../assets/map/Edit.svg"
import trashIcon from "../../../assets/map/Trash.png"

function buildWaypoints(pois) {
  const labels = [{ id: "start", label: "Start", kind: "start" }]
  labels.push(
    ...pois.map((poi, index) => ({
      id: poi.id,
      label: poi.label,
      kind: "poi",
      poiIndex: index + 1,
    })),
  )

  const startProgress = 18
  const endProgress = labels.length > 1 ? 82 : 18
  const step = labels.length > 1 ? (endProgress - startProgress) / (labels.length - 1) : 0

  return labels.map((item, index) => ({
    ...item,
    progress: startProgress + step * index,
    done: item.kind === "start",
  }))
}

export function PathOptExpanded({
  isManual,
  onToggleManual,
  onCollapse,
  pois = [],
  availablePois = [],
  onAddPoi,
  onDeletePoi,
  onReorderPoi,
  onRecallPr,
  activePoiIndex = 0,
  recallStarted = false,
}) {
  const [selectedPois, setSelectedPois] = useState(new Set())
  const [showPoiPicker, setShowPoiPicker] = useState(false)
  const [draggedPoiId, setDraggedPoiId] = useState(null)
  const [isRecalling, setIsRecalling] = useState(false)
  const waypoints = buildWaypoints(pois)
  const clampedActivePoiIndex = pois.length ? Math.min(activePoiIndex, pois.length - 1) : 0
  const currentWaypoint = recallStarted && pois.length ? waypoints[clampedActivePoiIndex + 1] : waypoints[0]
  const progressPct = recallStarted && pois.length ? Math.round(((clampedActivePoiIndex + 1) / pois.length) * 100) : 0
  const routeStartProgress = waypoints[0]?.progress ?? 18
  const doneWidth = Math.max(0, (currentWaypoint?.progress ?? routeStartProgress) - routeStartProgress)

  const togglePoi = (id) => {
    setSelectedPois(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleDragStart = (poiId) => {
    setDraggedPoiId(poiId)
  }

  const handleDragEnd = () => {
    setDraggedPoiId(null)
  }

  const handleDragOver = (event) => {
    event.preventDefault()
  }

  const handleDrop = (targetPoiId) => {
    if (!draggedPoiId || draggedPoiId === targetPoiId) return
    onReorderPoi?.(draggedPoiId, targetPoiId)
    setDraggedPoiId(null)
  }

  const handleRecallPr = async () => {
    if (!pois.length || !onRecallPr || isRecalling) return
    try {
      setIsRecalling(true)
      await onRecallPr()
    } catch (error) {
      console.error(error)
    } finally {
      setIsRecalling(false)
    }
  }

  const content = (
    <div className="path-opt-expanded">
      <div className="path-opt-expanded-left">
        <div className="path-opt-header">
          <img src={pathOptIcon} alt="" className="path-opt-icon" />
          <div>
            <h3 className="path-opt-title">Path Optimization</h3>
            <p className="path-opt-status">
              {isManual ? "Manual • Inactive" : "Auto • Active • Route Optimized"}
            </p>
          </div>
        </div>
        <div className="path-opt-actions">
          <button
            type="button"
            className={`path-btn ${!isManual ? "path-btn-active" : ""}`}
            onClick={() => onToggleManual(false)}
          >
            Auto
          </button>
          <button
            type="button"
            className={`path-btn ${isManual ? "path-btn-active" : ""}`}
            onClick={() => { onToggleManual(true); onCollapse(); }}
          >
            Manual
          </button>
        </div>
      </div>

      <div className="path-opt-route">
        <div className="route-labels">
          {waypoints.map((wp, i) => (
            <span key={i} className="route-label" style={{ left: `${wp.progress}%` }}>
              {wp.label}
            </span>
          ))}
        </div>
        <div className="route-track">
          <div
            className="route-line-done"
            style={{
              left: `${routeStartProgress}%`,
              width: `${doneWidth}%`,
            }}
          />
          {waypoints.map((wp, i) => (
            <div
              key={i}
              className={`route-node-wrapper${wp.kind === "poi" && draggedPoiId === wp.id ? " route-node-wrapper--dragging" : ""}`}
              style={{ left: `${wp.progress}%` }}
              draggable={wp.kind === "poi"}
              onDragStart={() => wp.kind === "poi" && handleDragStart(wp.id)}
              onDragEnd={handleDragEnd}
              onDragOver={wp.kind === "poi" ? handleDragOver : undefined}
              onDrop={() => wp.kind === "poi" && handleDrop(wp.id)}
            >
              <span
                className={`route-node ${(wp.kind === "start" || (recallStarted && wp.kind === "poi" && (wp.poiIndex - 1) < clampedActivePoiIndex)) ? "route-node-done" : "route-node-poi"}`}
                style={{
                  ...(wp.kind === "poi" && selectedPois.has(wp.id) && {
                    background: "#00b288",
                    borderColor: "#00b288",
                    boxShadow: "0 0 0 7px rgba(127, 243, 230, 0.20)"
                  })
                }}
                onClick={() => wp.kind === "poi" && togglePoi(wp.id)}
              >
                {wp.poiIndex && !wp.done && <span className="route-node-label">{wp.poiIndex}</span>}
              </span>
              {currentWaypoint?.id === wp.id && (
                <img src={poiArrow} alt="" className="route-current-marker" />
              )}
              {wp.kind === "poi" && selectedPois.has(wp.id) && (
                <div className="poi-popup">
                  <button type="button" className="poi-popup-btn" aria-label="Edit">
                    <img src={editIcon} alt="" width={11} height={11} />
                  </button>
                  <button type="button" className="poi-popup-btn" aria-label="Delete" onClick={() => onDeletePoi?.(wp.id)}>
                    <img src={trashIcon} alt="" width={11} height={11} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="route-progress-badge" style={{ left: `${currentWaypoint?.progress ?? waypoints[0]?.progress ?? 15}%` }}>
          {progressPct}%
        </div>
      </div>

      <div className="path-opt-expanded-right">
        <div className="path-add-wrap">
        <button
          type="button"
          className="path-add-btn"
          onClick={() => setShowPoiPicker((prev) => !prev)}
          disabled={!availablePois.length}
        >
          <img src={addPlusCircle} alt="" width={22} height={22} />
          Add To Path
        </button>
        {showPoiPicker && availablePois.length > 0 && (
          <div className="path-poi-picker">
            {availablePois.map((poi) => (
              <button
                key={poi.id}
                type="button"
                className="path-poi-picker-btn"
                onClick={() => {
                  onAddPoi?.(poi.id)
                  setShowPoiPicker(false)
                }}
              >
                <span>{poi.type || "PR"}</span>
                <strong>{poi.label}</strong>
              </button>
            ))}
          </div>
        )}
        </div>
        <button
          type="button"
          className="path-optimize-btn"
          onClick={handleRecallPr}
          disabled={!pois.length || isRecalling}
        >
          {isRecalling ? "Recalling..." : "Recall PR"}
        </button>
      </div>

      <button type="button" className="path-opt-collapse" aria-label="Collapse" onClick={onCollapse}>
        <img src={chevronRightIcon} alt="" width={28} height={28} style={{ transform: "rotate(180deg)" }} />
      </button>
    </div>
  )
  return createPortal(content, document.body)
}
