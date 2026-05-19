import { useMemo, useState } from "react"
import menuDuoIcon from "../../../assets/map/Menu_Duo_MD.png"
import { formatTssCoords } from "../utils/coordinates"

const TABS = ["PR", "EV1", "EV2"]

function tabMatchesPoi(tab, poi) {
  const type = (poi.type ?? "").toUpperCase()
  if (tab === "PR") return type === "PR" || type.includes("BREAD") || type === "LTV"
  if (tab === "EV1") return type.includes("EV1") || type === "EV"
  if (tab === "EV2") return type.includes("EV2")
  return true
}

export function PoiPanel({ pois = [] }) {
  const [activeTab, setActiveTab] = useState("PR")
  const [selectedPoi, setSelectedPoi] = useState(null)

  const listItems = useMemo(() => {
    const filtered = pois.filter((p) => tabMatchesPoi(activeTab, p))
    const rows = filtered.length > 0 ? filtered : pois
    return rows.map((poi) => ({
      id: poi.id,
      label: poi.label,
      coords: formatTssCoords(poi.tssX, poi.tssY),
      state: poi.muted ? "completed" : poi.active ? "active" : "default",
    }))
  }, [pois, activeTab])

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
            {listItems.length === 0 ? (
              <p className="poi-empty-hint">No POIs from Hub yet. Check Docker on port 7070.</p>
            ) : (
              <div className="poi-track-list">
                {listItems.map((poi, i) => (
                  <div
                    key={poi.id}
                    className={`poi-row${i < listItems.length - 1 ? ` poi-row--line-${poi.state}` : ""}`}
                  >
                    <div className="poi-dot-col">
                      <span
                        className={`poi-route-dot${poi.state === "completed" ? " poi-route-dot--completed" : poi.state === "active" ? " poi-route-dot--active" : ""}`}
                      />
                    </div>
                    <div
                      className={`poi-item poi-item--${poi.state}${selectedPoi === poi.id ? " poi-item--selected" : ""}`}
                      onClick={() => poi.state !== "completed" && setSelectedPoi(poi.id)}
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
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
