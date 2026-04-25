import chevronDownIcon from "../../../assets/map/Chevron_Down.svg"
import mapPinIcon from "../../../assets/map/Map_Pin.svg"
import warningIcon from "../../../assets/map/Triangle_Warning.svg"

export function MissionBar() {
  return (
    <header className="mission-bar">
      <div className="mission-bar-buttons">
        <button type="button" className="mission-map-btn">
          <img src={chevronDownIcon} alt="" width={24} height={24} />
          POI
        </button>
        <button type="button" className="mission-map-btn">
          <img src={mapPinIcon} alt="" width={24} height={24} />
          Add POI
        </button>
        <button type="button" className="mission-map-btn">
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
          <span className="mission-stat-value">00:18:35</span>
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
