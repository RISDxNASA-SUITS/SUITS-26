import { useMemo, useState } from "react"
import menuDuoIcon from "../../../assets/map/Menu_Duo_MD.png"

const TABS = ["PR", "EV1", "EV2"]

function formatCoords(x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return "--"
  return `${x.toFixed(1)}, ${y.toFixed(1)}`
}

export function PoiPanel({ pois = [] }) {
  const [activeTab, setActiveTab] = useState("PR")
  const [selectedPoiId, setSelectedPoiId] = useState(null)

  const visiblePois = useMemo(
    () => pois.filter((poi) => (poi.type || "PR").toUpperCase() === activeTab),
    [activeTab, pois],
  )

  return (
    <div className="poi-panel">
      <div className="poi-panel-inner">
        <div className="poi-panel-top">
          <p className="poi-panel-title">Points of Interest</p>
        </div>

        <div className="poi-tabs">
          {TABS.map((tab) => (
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
            {visiblePois.length === 0 ? (
              <div className="poi-empty-state">No POIs yet</div>
            ) : (
              <div className="poi-track-list">
                {visiblePois.map((poi, index) => (
                  <div
                    key={poi.id}
                    className={`poi-row${index < visiblePois.length - 1 ? " poi-row--line-default" : ""}`}
                  >
                    <div className="poi-dot-col">
                      <span className="poi-route-dot" />
                    </div>
                    <div
                      className={`poi-item poi-item--default${selectedPoiId === poi.id ? " poi-item--selected" : ""}`}
                      onClick={() => setSelectedPoiId(poi.id)}
                    >
                      <div className="poi-item-text">
                        <p className="poi-item-label">{poi.label}</p>
                        <p className="poi-item-coords">{formatCoords(poi.tssX, poi.tssY)}</p>
                      </div>
                      <button type="button" className="poi-menu-btn" aria-label="Menu">
                        <img src={menuDuoIcon} alt="" width={24} height={24} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
