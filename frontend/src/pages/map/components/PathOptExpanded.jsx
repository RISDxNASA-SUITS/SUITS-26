import { useState } from "react"
import { createPortal } from "react-dom"
import pathOptIcon from "../../../assets/map/Path_opt.svg"
import chevronRightIcon from "../../../assets/map/Chevron_Right.svg"
import poiArrow from "../../../assets/map/POI-arrow.png"
import addPlusCircle from "../../../assets/map/Add_Plus_Circle.png"
import editIcon from "../../../assets/map/Edit.svg"
import trashIcon from "../../../assets/map/Trash.png"

const waypoints = [
  { label: "Start", progress: 15, done: true },
  { label: "POI 1", progress: 25, done: true, poiIndex: 1 },
  { label: "POI 2", progress: 38, done: false, current: true, poiIndex: 2 },
  { label: "POI 3", progress: 50, done: false, poiIndex: 3 },
  { label: "POI 4", progress: 62, done: false, poiIndex: 4 },
  { label: "POI 5", progress: 74, done: false, poiIndex: 5 },
  { label: "Destination", progress: 85, done: false, destination: true },
]

export function PathOptExpanded({ isManual, onToggleManual, onCollapse, onOpenPoiPanel }) {
  const [selectedPois, setSelectedPois] = useState(new Set())

  const togglePoi = (i) => {
    setSelectedPois(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
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
          <div className="route-line-upcoming" style={{ left: `${waypoints.find(w => w.current)?.progress}%`, right: `${100 - waypoints[waypoints.length - 1].progress}%` }} />
          <div className="route-line-done" style={{ left: `${waypoints[0].progress}%`, width: `${waypoints.find(w => w.current)?.progress - waypoints[0].progress}%` }} />
          {waypoints.map((wp, i) => (
            wp.current ? (
              <img key={i} src={poiArrow} alt="" className="route-current-marker" style={{ left: `${wp.progress}%` }} />
            ) : (
              <div key={i} className="route-node-wrapper" style={{ left: `${wp.progress}%` }}>
                <span
                  className={`route-node ${wp.done ? "route-node-done" : wp.destination ? "route-node-upcoming" : "route-node-poi"}`}
                  style={{
                    ...(!wp.done && selectedPois.has(i) && {
                      background: "#00b288",
                      borderColor: "#00b288",
                      boxShadow: "0 0 0 7px rgba(127, 243, 230, 0.20)"
                    })
                  }}
                  onClick={() => !wp.done && togglePoi(i)}
                >
                  {wp.poiIndex && !wp.done && <span className="route-node-label">{wp.poiIndex}</span>}
                </span>
                {!wp.done && selectedPois.has(i) && (
                  <div className="poi-popup">
                    <button type="button" className="poi-popup-btn" aria-label="Edit">
                      <img src={editIcon} alt="" width={11} height={11} />
                    </button>
                    <button type="button" className="poi-popup-btn" aria-label="Delete">
                      <img src={trashIcon} alt="" width={11} height={11} />
                    </button>
                  </div>
                )}
              </div>
            )
          ))}
        </div>
        <div className="route-progress-badge" style={{ left: `${waypoints.find(w => w.current)?.progress}%` }}>46%</div>
      </div>

      <div className="path-opt-expanded-right">
        <button type="button" className="path-add-btn">
          <img src={addPlusCircle} alt="" width={22} height={22} />
          Add To Path
        </button>
        <button type="button" className="path-optimize-btn">Recall PR</button>
      </div>

      <button type="button" className="path-opt-collapse" aria-label="Collapse" onClick={onCollapse}>
        <img src={chevronRightIcon} alt="" width={28} height={28} style={{ transform: "rotate(180deg)" }} />
      </button>
    </div>
  )
  return createPortal(content, document.body)
}
