import { beaconData } from "../data/dashboardData"
import { useLtvBeacon } from "../../../hooks/useLtvBeacon"
import lunarSurfaceImage from "../../../assets/dashboard/lunar_surface.png"
import roverImage from "../../../assets/dashboard/rover.png"
import polygon37 from "../../../assets/dashboard/polygon37.svg"
import { Panel } from "./Panel"

const SIGNAL_BAR_COUNT = 35
const SIGNAL_BAR_MAX_H = 96
const SIGNAL_MIDLINE_H = 55

function derivedSignalBars(rawBars) {
  return rawBars.slice(-SIGNAL_BAR_COUNT).map((v) => {
    const height = Math.round(v * SIGNAL_BAR_MAX_H)
    return { height, tone: height > SIGNAL_MIDLINE_H ? "high" : "low" }
  })
}

export function BeaconPanel() {
  const beacon = useLtvBeacon()
  const signalBars = derivedSignalBars(beacon.signalBars)
  const bearingRad = (beacon.bearingDeg * Math.PI) / 180
  const dotLeft = (50 + 30 * Math.sin(bearingRad)).toFixed(1)
  const dotTop = (50 - 30 * Math.cos(bearingRad)).toFixed(1)
  const [modePrefix = "CURRENT MODE:", modeValue = "LOCATE"] = beaconData.mode.split(": ")


  return (
    <Panel className="beacon-panel">
      <header className="beacon-title-row">
        <span className="beacon-title-dot" aria-hidden="true">
          <span />
        </span>
        <div className="beacon-title-pill">
          <h2>LTV Beacon</h2>
        </div>
      </header>

      <div className="mode-bar">
        <span className="mode-label">
          {modePrefix}
          <span className="mode-value"> {modeValue}</span>
        </span>
        <strong>Duration: {beacon.formattedDuration}</strong>
      </div>

      <div className="distance-row">
        <div className="distance-header">
          <p className="distance-label">Distance to Beacon</p>
          <strong className="distance-current-val">~{beacon.bottomDistanceM} m</strong>
        </div>
        <div className="distance-track-section">
          <span className="distance-end-label distance-end-label--start">500 m</span>
          <div className="distance-track-wrapper">
            <div className="distance-track">
              <div className="distance-track-line" />
              <div
                className="distance-track-fill"
                style={{ width: `${((beacon.bottomGoalM - beacon.bottomDistanceM) / beacon.bottomGoalM * 100).toFixed(1)}%` }}
              />
              {[0, 20, 40, 60, 80, 100].map((pct, i) => (
                <span key={i} className={`distance-dot${i === 0 || i === 5 ? " large" : ""}`} style={{ left: `${pct}%` }} />
              ))}
            </div>
            <img
              src={polygon37}
              alt=""
              aria-hidden="true"
              className="distance-position-marker"
              style={{ left: `${((beacon.bottomGoalM - beacon.bottomDistanceM) / beacon.bottomGoalM * 100).toFixed(1)}%` }}
            />
          </div>
          <span className="distance-end-label distance-end-label--end">0 m</span>
        </div>
        <div className="distance-start-end-labels">
          <span className="distance-labels-start">Start</span>
          <span className="distance-labels-spacer" />
          <span className="distance-labels-end">Beacon</span>
        </div>
      </div>

      <div className="kv-row">
        <article className="pr-ltv-card">
          <p className="pr-ltv-label">PR - LTV Direction</p>
          <strong className="pr-ltv-value">{beacon.cardinalLabel}</strong>
        </article>
        <article className="bearing-card">
          <p className="bearing-label">Bearing to Rover</p>
          <strong className="bearing-value">{Math.round(beacon.bearingDeg)}°</strong>
        </article>
        <article className="coords-card">
          <p className="coords-label">LTV Coordinates</p>
          <strong className="coords-value">{beacon.formattedCoords}</strong>
        </article>
      </div>

      <div className="beacon-main">
        <article className="ev-feed">
          <div className="feed-surface" aria-label="EV Feed lunar surface view">
            <img className="feed-bg" src={lunarSurfaceImage} alt="" aria-hidden="true" />
            <img className="feed-rover" src={roverImage} alt="" aria-hidden="true" />
            <span className="feed-dot" aria-hidden="true" />
            <h3>EV Feed</h3>
            <p className="feed-risk">
              <span>Environmental Risk Index:</span> <strong>{beacon.envRiskIndex.toFixed(2)} ({beacon.riskLabel})</strong>
            </p>
          </div>
        </article>

        <article className="radar-card">
          <p className="radar-meta-line">
            <span>LTV Location:</span> <strong>{beacon.ltvLocationDetected ? "Detected" : "Not Detected"}</strong>
          </p>
          <p className="radar-meta-line">
            <span>Distance to Beacon:</span> <strong>{beacon.distanceNearM} m</strong>
            <em> / {beacon.distanceFarM} m</em>
          </p>
          <div className="radar" aria-hidden="true">
            <span className="radar-ring" />
            <span className="radar-disc" />
            <span className="radar-inner-rings" />
            <span className="radar-ticks" />
            <span className="radar-axis radar-axis-h" />
            <span className="radar-axis radar-axis-v" />
            <span className="radar-arrow" style={{ transform: `translateY(-50%) rotate(${(beacon.bearingDeg - 90).toFixed(1)}deg)` }} />
            <span className="radar-center-icon" />
            <span className="radar-center-dot" />
            <span className="radar-red-dot" style={{ left: `${dotLeft}%`, top: `${dotTop}%`, transition: "left 0.5s ease-out, top 0.5s ease-out" }} />
            <span className="radar-dir radar-n">N</span>
            <span className="radar-dir radar-e">E</span>
            <span className="radar-dir radar-s">S</span>
            <span className="radar-dir radar-w">W</span>
          </div>
          <ul className="radar-details">
            <li>
              <span className="detail-left">
                <span className="detail-icon tracking" aria-hidden="true" />
                <span className="detail-label">TRACKING:</span>
              </span>
              <span className="detail-value">{beacon.trackingBeaconId}</span>
            </li>
            <li>
              <span className="detail-left">
                <span className="detail-icon center" aria-hidden="true" />
                <span className="detail-label">CENTER</span>
              </span>
              <span className="detail-value">{beacon.centerLabel}</span>
            </li>
            <li>
              <span className="detail-left">
                <span className="detail-icon direction" aria-hidden="true">↑</span>
                <span className="detail-label">DIRECTION</span>
              </span>
              <span className="detail-value">{beacon.directionRowSub}</span>
            </li>
          </ul>
        </article>
      </div>

      <section className="signal-section">
        <div className="signal-header">
          <p className="signal-title">Signal Strength</p>
          <p className="signal-latency">Transmission Latency: {beacon.latencySec.toFixed(2)} s</p>
        </div>
        <div className="signal-chart" aria-hidden="true">
          <span className="signal-midline" />
          <div className="signal-bars-wrap">
            <div className="signal-bars-main">
              {signalBars.map((bar, index) => (
                <span key={index} className={`signal-bar ${bar.tone}`} style={{ height: `${bar.height}px` }} />
              ))}
            </div>
            <span className="signal-divider" />
          </div>
          <p className="signal-readout">
            <span className="signal-percent">{beacon.signalPct}%</span>
            <span className="signal-dbm"> ({beacon.signalDbm} dBm)</span>
          </p>
        </div>
      </section>
    </Panel>
  )
}
