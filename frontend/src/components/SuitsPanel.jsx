import { useState } from "react"
import { suitData } from "../data/dashboardData"
import { Panel } from "./Panel"

function StatBars({ count = 10, className = "" }) {
  return (
    <div className={`stat-bars ${className}`.trim()} aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <span key={index} />
      ))}
    </div>
  )
}

function O2Card() {
  const o2BarCount = 13
  const [selectedTank, setSelectedTank] = useState(1)
  const [hoursPart = "", minutesPart = ""] = suitData.totalRemaining.split(" ")
  const hours = hoursPart.replace("hr", "")
  const minutes = minutesPart.replace("min", "")

  return (
    <div className="o2-card">
      <div className="o2-head">
        <h3>
          O<sub>2</sub>
        </h3>
        <div className="o2-bars" aria-hidden="true">
          {Array.from({ length: o2BarCount }).map((_, index) => (
            <span key={index} />
          ))}
        </div>
        <p className="o2-value">
          <strong>{suitData.oxygenPsi}</strong>
          <span>psi</span>
        </p>
      </div>

      <div
        className={`o2-tank selectable ${selectedTank === 1 ? "bordered" : ""}`.trim()}
        role="button"
        tabIndex={0}
        aria-pressed={selectedTank === 1}
        onClick={() => setSelectedTank(1)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            setSelectedTank(1)
          }
        }}
      >
        <span className="tank-label">
          Tank
          <br />
          1
        </span>
        <div className="tank-track">
          <span style={{ width: `${suitData.oxygenTanks[0]}%` }} />
        </div>
        <span className="tank-value">
          <span className="num">{suitData.oxygenTanks[0]}</span>
          <span className="unit">%</span>
        </span>
      </div>

      <div
        className={`o2-tank selectable ${selectedTank === 2 ? "bordered" : ""}`.trim()}
        role="button"
        tabIndex={0}
        aria-pressed={selectedTank === 2}
        onClick={() => setSelectedTank(2)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            setSelectedTank(2)
          }
        }}
      >
        <span className="tank-label">
          Tank
          <br />
          2
        </span>
        <div className="tank-track">
          <span style={{ width: `${suitData.oxygenTanks[1]}%` }} />
        </div>
        <span className="tank-value">
          <span className="num">{suitData.oxygenTanks[1]}</span>
          <span className="unit">%</span>
        </span>
      </div>

      <p className="o2-remaining">
        <span className="label">Total Remaining Time:</span>
        <span className="value">
          <span className="num">{hours}</span>
          <span className="unit">hr</span>
          <span className="num"> {minutes}</span>
          <span className="unit">min</span>
        </span>
      </p>
    </div>
  )
}

function CO2Card() {
  const co2BarCount = 13
  const [selectedCo2Card, setSelectedCo2Card] = useState("scrubber")

  return (
    <div className="co2-card">
      <div className="co2-head">
        <h3>
          CO<sub>2</sub>
        </h3>
        <div className="co2-bars" aria-hidden="true">
          {Array.from({ length: co2BarCount }).map((_, index) => (
            <span key={index} className={index < 4 ? "active" : ""} />
          ))}
        </div>
        <p className="co2-value">
          <strong>{suitData.co2}</strong>
          <span>mmHg</span>
        </p>
      </div>

      <div
        className={`co2-tank selectable ${selectedCo2Card === "scrubber" ? "bordered" : ""}`.trim()}
        role="button"
        tabIndex={0}
        aria-pressed={selectedCo2Card === "scrubber"}
        onClick={() => setSelectedCo2Card("scrubber")}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            setSelectedCo2Card("scrubber")
          }
        }}
      >
        <span className="tank-label scrubber-label">
          Scrubber
          <br />
          Efficiency
        </span>
        <div className="tank-track">
          <span style={{ width: `${suitData.scrubber}%` }} />
        </div>
        <span className="tank-value">
          <span className="num">{suitData.scrubber}</span>
          <span className="unit">%</span>
        </span>
      </div>

      <div
        className={`co2-tank selectable ${selectedCo2Card === "tank2" ? "bordered" : ""}`.trim()}
        role="button"
        tabIndex={0}
        aria-pressed={selectedCo2Card === "tank2"}
        onClick={() => setSelectedCo2Card("tank2")}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            setSelectedCo2Card("tank2")
          }
        }}
      >
        <span className="tank-label">
          Tank
          <br />
          2
        </span>
        <div className="tank-track">
          <span style={{ width: `${suitData.co2Tank}%` }} />
        </div>
        <span className="tank-value">
          <span className="num">{suitData.co2Tank}</span>
          <span className="unit">%</span>
        </span>
      </div>
    </div>
  )
}

function LcvgBlock() {
  const [pressureValue = "15.2", pressureUnit = "psi"] = suitData.fwPressure.split(" ")
  const [quantityValue = "84", quantityUnit = "%"] = suitData.fwQuantity.split(" ")
  const inlet = suitData.lcvgInlet.replace(" deg F", "")
  const ret = suitData.lcvgReturn.replace(" deg F", "")

  return (
    <div className="lcvg-block">
      <article className="lcvg-left">
        <p className="lcvg-title">LCVG Flow Rate</p>
        <div className="lcvg-gauge">
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <circle cx="60" cy="60" r="42" className="ring-bg" />
            <circle cx="60" cy="60" r="42" className="ring-main" />
          </svg>
          <div className="lcvg-gauge-center">
            <strong>{suitData.flowRate}</strong>
            <span>lb/hr</span>
          </div>
        </div>

        <div className="lcvg-fw">
          <div>
            <span className="label">FW-Pressure</span>
            <strong className="value">{pressureValue}</strong>
            <small className="unit">{pressureUnit}</small>
          </div>
          <div>
            <span className="label">FW-Quantity</span>
            <strong className="value">{quantityValue}</strong>
            <small className="unit">{quantityUnit}</small>
          </div>
        </div>
      </article>

      <article className="lcvg-right">
        <div className="lcvg-chart-wrap">
          <svg viewBox="0 0 229 170" aria-hidden="true">
            <defs>
              <marker id="arrowMain" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                <polygon points="0,0 8,4 0,8" fill="#7fa8d2" />
              </marker>
              <marker id="arrowSub" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                <polygon points="0,0 8,4 0,8" fill="#3f64ba" />
              </marker>
            </defs>
            <line x1="14" y1="0" x2="14" y2="170" className="axis-line" />
            <line x1="0" y1="152" x2="226" y2="152" className="axis-line" />
            <polyline points="14,106 48,80 82,92 116,66 150,40 184,60 210,78" className="line-main" markerEnd="url(#arrowMain)" />
            <polyline points="14,122 48,98 82,110 116,84 150,60 184,80 210,96" className="line-sub" markerEnd="url(#arrowSub)" />
            <g transform="translate(22, 34) rotate(-90)" className="axis-label-group">
              <text x="0" y="0" textAnchor="middle" dominantBaseline="central" className="axis-label-svg">
                TEMP (°F)
              </text>
            </g>
          </svg>
          <p className="time-label">HH:MM:SS</p>
        </div>

        <div className="lcvg-stats">
          <div className="lcvg-stats-row">
            <span className="lcvg-stats-label">LCVG Inlet</span>
            <div className="lcvg-stats-reading">
              <strong>{inlet}</strong>
              <span>F°</span>
            </div>
          </div>
          <div className="lcvg-stats-row">
            <span className="lcvg-stats-label">LCVG Return</span>
            <div className="lcvg-stats-reading">
              <strong>{ret}</strong>
              <span>F°</span>
            </div>
          </div>
          <p className="lcvg-delta-row">
            <span className="delta-label">ΔT:</span>
            <span className="delta-current">15F°</span>
            <span className="delta-sep">/</span>
            <em>20F°</em>
          </p>
        </div>
      </article>
    </div>
  )
}

export function SuitsPanel() {
  return (
    <Panel className="suits-panel">
      <header className="suits-title-row">
        <span className="suits-title-dot" aria-hidden="true">
          <span />
        </span>
        <div className="suits-title-pill">
          <h2>Suits</h2>
        </div>
      </header>
      <div className="suit-topline">
        <span className="suit-row-dot" aria-hidden="true" />
        <span className="suit-id">{suitData.id}</span>
        <span className="suit-status">{suitData.status}</span>
        <span className="suit-time">{suitData.timestamp}</span>
      </div>
      <p className="system-status">SYSTEMS NOMINAL</p>

      <O2Card />
      <CO2Card />
      <LcvgBlock />
    </Panel>
  )
}
