import { useEffect, useRef, useState } from "react"
import chevronDownIcon from "../../../assets/map/Chevron_Down.svg"
import mapPinIcon from "../../../assets/map/Map_Pin.svg"
import warningIcon from "../../../assets/map/Triangle_Warning.svg"

function formatHms(totalMs) {
  const totalSec = Math.max(0, Math.floor(totalMs / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export function MissionBar({ onPoiClick, showPoiPanel, onAddPoiClick, showAddPoi, onAddHazardClick, showAddHazard }) {
  const startedAtRef = useRef(Date.now())
  const [missionElapsedTime, setMissionElapsedTime] = useState("00:00:00")

  useEffect(() => {
    const timer = window.setInterval(() => {
      setMissionElapsedTime(formatHms(Date.now() - startedAtRef.current))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  return (
    <header className="mission-bar">
      <div className="mission-bar-buttons">
        <button
          type="button"
          className={`mission-map-btn${showPoiPanel ? " mission-map-btn--active" : ""}`}
          onClick={onPoiClick}
        >
          <img
            src={chevronDownIcon}
            alt=""
            width={24}
            height={24}
            style={showPoiPanel ? { transform: "rotate(180deg)" } : undefined}
          />
          POI
        </button>
        <button
          type="button"
          className={`mission-map-btn${showAddPoi ? " mission-map-btn--active" : ""}`}
          onClick={onAddPoiClick}
        >
          <img src={mapPinIcon} alt="" width={24} height={24} />
          Add POI
        </button>
        <button
          type="button"
          className={`mission-map-btn${showAddHazard ? " mission-map-btn--active" : ""}`}
          onClick={onAddHazardClick}
        >
          <img src={warningIcon} alt="" width={24} height={24} />
          Add Hazard
        </button>
      </div>

      <div className="mission-stats">
        <div className="mission-stat">
          <span className="mission-stat-label">TIME TO NEXT POI</span>
          <span className="mission-stat-value">00:02:05</span>
        </div>
        <div className="mission-stat">
          <span className="mission-stat-label">MISSION ELAPSED TIME</span>
          <span className="mission-stat-value">{missionElapsedTime}</span>
        </div>
        <div className="mission-stat">
          <span className="mission-stat-label">PR SPEED</span>
          <span className="mission-stat-value">0 kph</span>
        </div>
        <div className="mission-stat">
          <span className="mission-stat-label">PR DIRECTION</span>
          <span className="mission-stat-value">31° SW</span>
        </div>
      </div>
    </header>
  )
}
