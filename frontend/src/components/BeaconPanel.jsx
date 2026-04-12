import { beaconData } from "../data/dashboardData"
import lunarSurfaceImage from "../assets/lunar_surface.png"
import roverImage from "../assets/rover.png"
import { Panel } from "./Panel"

const signalBarsMain = [
  { height: 29, tone: "low" },
  { height: 36, tone: "low" },
  { height: 35, tone: "low" },
  { height: 40, tone: "low" },
  { height: 74, tone: "high" },
  { height: 40, tone: "low" },
  { height: 29, tone: "low" },
  { height: 29, tone: "low" },
  { height: 35, tone: "low" },
  { height: 87, tone: "high" },
  { height: 29, tone: "low" },
  { height: 72, tone: "high" },
  { height: 18, tone: "low" },
  { height: 30, tone: "low" },
  { height: 35, tone: "low" },
  { height: 38, tone: "low" },
  { height: 42, tone: "low" },
  { height: 47, tone: "low" },
  { height: 40, tone: "low" },
  { height: 30, tone: "low" },
  { height: 56, tone: "low" },
  { height: 48, tone: "low" },
  { height: 73, tone: "low" },
  { height: 65, tone: "low" },
  { height: 61, tone: "low" },
  { height: 88, tone: "high" },
  { height: 86, tone: "high" },
  { height: 90, tone: "high" },
  { height: 88, tone: "high" },
  { height: 96, tone: "high" },
  { height: 90, tone: "high" },
  { height: 85, tone: "high" },
  { height: 84, tone: "high" },
  { height: 82, tone: "high" },
  { height: 96, tone: "high" },
]

export function BeaconPanel() {
  const [modePrefix = "CURRENT MODE:", modeValue = "LOCATE"] = beaconData.mode.split(": ")
  const [distanceCurrent = "", distanceMin = ""] = beaconData.distanceDisplay.split(" / ")
  const signalPercent = beaconData.signalStrength.split(" ")[0] ?? ""
  const signalDbm = beaconData.signalStrength.match(/\(([^)]+)\)/)?.[1] ?? ""

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
        <strong>Duration: {beaconData.duration}</strong>
      </div>

      <div className="beacon-main">
        <article className="ev-feed">
          <div className="feed-surface" aria-label="EV Feed lunar surface view">
            <img className="feed-bg" src={lunarSurfaceImage} alt="" aria-hidden="true" />
            <img className="feed-rover" src={roverImage} alt="" aria-hidden="true" />
            <span className="feed-dot" aria-hidden="true" />
            <h3>EV Feed</h3>
            <p className="feed-risk">
              <span>Environmental Risk Index:</span> <strong>0.18 (Stable)</strong>
            </p>
          </div>
        </article>

        <article className="radar-card">
          <p className="radar-meta-line">
            <span>LTV Location:</span> <strong>{beaconData.locationStatus}</strong>
          </p>
          <p className="radar-meta-line">
            <span>Distance to Beacon:</span> <strong>{beaconData.distanceToBeacon.split(" / ")[0]}</strong>
            <em> / {beaconData.distanceToBeacon.split(" / ")[1]}</em>
          </p>
          <div className="radar" aria-hidden="true">
            <span className="radar-ring" />
            <span className="radar-disc" />
            <span className="radar-inner-rings" />
            <span className="radar-ticks" />
            <span className="radar-axis radar-axis-h" />
            <span className="radar-axis radar-axis-v" />
            <span className="radar-arrow" />
            <span className="radar-center-icon" />
            <span className="radar-center-dot" />
            <span className="radar-red-dot" />
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
              <span className="detail-value">LTV BEACON-07</span>
            </li>
            <li>
              <span className="detail-left">
                <span className="detail-icon center" aria-hidden="true" />
                <span className="detail-label">CENTER</span>
              </span>
              <span className="detail-value">Rover-2</span>
            </li>
            <li>
              <span className="detail-left">
                <span className="detail-icon direction" aria-hidden="true">↑</span>
                <span className="detail-label">DIRECTION</span>
              </span>
              <span className="detail-value">Bearing Radar</span>
            </li>
          </ul>
        </article>
      </div>

      <div className="kv-row">
        <article className="pr-ltv-card">
          <p className="pr-ltv-label">PR - LTV Direction</p>
          <strong className="pr-ltv-value">{beaconData.direction}</strong>
        </article>
        <article className="bearing-card">
          <p className="bearing-label">Bearing to Rover</p>
          <strong className="bearing-value">{beaconData.bearing}</strong>
        </article>
        <article className="coords-card">
          <p className="coords-label">LTV Coordinates</p>
          <strong className="coords-value">{beaconData.coordinates}</strong>
        </article>
      </div>

      <div className="distance-row">
        <p>Distance to Beacon</p>
        <div className="progress large">
          <span style={{ width: `${beaconData.distanceProgress * 100}%` }} />
        </div>
        <strong className="distance-value">
          <span className="distance-value-current">{distanceCurrent}</span>
          <span className="distance-value-min"> / {distanceMin}</span>
        </strong>
      </div>

      <section className="signal-section">
        <div className="signal-header">
          <p className="signal-title">Signal Strength</p>
          <p className="signal-latency">Transmission Latency: {beaconData.latency}</p>
        </div>
        <div className="signal-chart" aria-hidden="true">
          <span className="signal-midline" />
          <div className="signal-bars-wrap">
            <div className="signal-bars-main">
              {signalBarsMain.map((bar, index) => (
                <span key={index} className={`signal-bar ${bar.tone}`} style={{ height: `${bar.height}px` }} />
              ))}
            </div>
            <span className="signal-divider" />
          </div>
          <p className="signal-readout">
            <span className="signal-percent">{signalPercent}</span>
            <span className="signal-dbm"> ({signalDbm})</span>
          </p>
        </div>
      </section>
    </Panel>
  )
}
