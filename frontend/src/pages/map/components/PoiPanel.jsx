import { useState } from "react"
import menuDuoIcon from "../../../assets/map/Menu_Duo_MD.png"

const TABS = ["PR", "EV1", "EV2"]

const pois = [
  { label: "POI 1", coords: "38.847185, -77.333624", state: "completed" },
  { label: "POI 2", coords: "38.847185, -77.333624", state: "completed" },
  { label: "POI 3", coords: "38.847185, -77.333624", state: "completed" },
  { label: "POI 4", coords: "38.847185, -77.333624", state: "completed" },
  { label: "POI 5", coords: "38.847185, -77.333624", state: "active" },
  { label: "POI 6", coords: "38.847185, -77.333624", state: "default" },
  { label: "POI 7", coords: "38.847185, -77.333624", state: "default" },
]

export function PoiPanel({ onClose }) {
  const [activeTab, setActiveTab] = useState("PR")
  const [selectedPoi, setSelectedPoi] = useState(1)

  return (
    <div className="poi-panel">
      <div className="poi-panel-inner">
        <div className="poi-panel-top">
          <p className="poi-panel-title">Points of Interest</p>
        </div>

        <div className="poi-tabs">
          {TABS.map(tab => (
            <button
              key={tab}
              type="button"
              className={`poi-tab${activeTab === tab ? " poi-tab--active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="poi-list-area">
          <div className="poi-scroll-container">
            <div className="poi-track-list">
              {pois.map((poi, i) => (
                <div
                  key={i}
                  className={`poi-row${i < pois.length - 1 ? ` poi-row--line-${poi.state}` : ""}`}
                >
                  <div className="poi-dot-col">
                    <span className={`poi-route-dot${poi.state === "completed" ? " poi-route-dot--completed" : poi.state === "active" ? " poi-route-dot--active" : ""}`} />
                  </div>
                  <div
                    className={`poi-item poi-item--${poi.state}${selectedPoi === i ? " poi-item--selected" : ""}`}
                    onClick={() => poi.state !== "completed" && setSelectedPoi(i)}
                  >
                    <div className="poi-item-text">
                      <p className="poi-item-label">{poi.label}</p>
                      <p className="poi-item-coords">{poi.coords}</p>
                    </div>
                    <button type="button" className="poi-menu-btn" aria-label="Menu">
                      <img src={menuDuoIcon} alt="" width={24} height={24} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
