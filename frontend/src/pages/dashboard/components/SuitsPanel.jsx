import { vitalLabels } from "../data/dashboardData"
import { useSuitsTelemetry } from "../../../hooks/useSuitsTelemetry"
import { Panel } from "./Panel"
import arrowUpward from "../../../assets/dashboard/arrow_upward.svg"
import arrowDownward from "../../../assets/dashboard/arrow_downward.svg"
import arrowForward from "../../../assets/dashboard/arrow_forward.svg"
import headshotIcon from "../../../assets/dashboard/headshot.png"

function StatBars({ count = 10, className = "" }) {
  return (
    <div className={`stat-bars ${className}`.trim()} aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <span key={index} />
      ))}
    </div>
  )
}

const safeNumber = (value) => (typeof value === "number" && Number.isFinite(value) ? value : 0)
const displayValue = (value, decimals = 0, blank = false) => {
  if (blank || value === null || value === undefined || Number.isNaN(Number(value))) return ""
  return decimals === 0 ? Math.round(value) : Number(value).toFixed(decimals)
}

function O2Card({ psi, tank1Pct, tank2Pct, o2Segments, blank }) {
  const o2BarCount = 13
  const activeCount = Math.round((safeNumber(o2Segments) / 15) * o2BarCount)

  return (
    <div className="o2-card">
      <div className="o2-head">
        <h3>
          O<sub>2</sub>
        </h3>
        <div className="o2-bars" aria-hidden="true">
          {Array.from({ length: o2BarCount }).map((_, index) => (
            <span key={index} className={index < activeCount ? "active" : ""} />
          ))}
        </div>
        <p className="o2-value">
          <strong>{displayValue(psi, 1, blank)}</strong>
          <span>psi</span>
        </p>
      </div>

      <div className="o2-tanks-row">
        <div className="o2-tank-card">
          <span className="tank-card-label">Tank 1</span>
          <div className="tank-card-value">
            <span className="tank-card-num">{displayValue(tank1Pct, 0, blank)}</span>
            <span className="tank-card-unit">%</span>
          </div>
        </div>
        <div className="o2-tank-card">
          <span className="tank-card-label">Tank 2</span>
          <div className="tank-card-value">
            <span className="tank-card-num">{displayValue(tank2Pct, 0, blank)}</span>
            <span className="tank-card-unit">%</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function CO2Card({ mmHg, scrubberPct, co2TankPct, co2Segments, blank }) {
  const co2BarCount = 13
  const activeCount = Math.round((safeNumber(co2Segments) / 15) * co2BarCount)

  return (
    <div className="co2-card">
      <div className="co2-head">
        <h3>
          CO<sub>2</sub>
        </h3>
        <div className="co2-bars" aria-hidden="true">
          {Array.from({ length: co2BarCount }).map((_, index) => (
            <span key={index} className={index < activeCount ? "active" : ""} />
          ))}
        </div>
        <p className="co2-value">
          <strong>{displayValue(mmHg, 1, blank)}</strong>
          <span>mmHg</span>
        </p>
      </div>

      <div className="o2-tanks-row">
        <div className="o2-tank-card">
          <span className="tank-card-label">Scrubber A</span>
          <div className="tank-card-value">
            <span className="tank-card-num">{displayValue(scrubberPct, 0, blank)}</span>
            <span className="tank-card-unit">%</span>
          </div>
        </div>
        <div className="o2-tank-card">
          <span className="tank-card-label">Scrubber B</span>
          <div className="tank-card-value">
            <span className="tank-card-num">{displayValue(co2TankPct, 0, blank)}</span>
            <span className="tank-card-unit">%</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function LcvgGauge({ norm }) {
  const r = 36
  const cx = 50
  const cy = 54
  const circumference = 2 * Math.PI * r
  const arcLength = (300 / 360) * circumference
  const fillLength = Math.min(norm, 1) * arcLength
  const rotation = `rotate(120, ${cx}, ${cy})`

  return (
    <svg viewBox="0 0 100 100" className="lcvg-gauge-svg" aria-hidden="true">
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke="rgba(185,211,205,0.1)" strokeWidth="5"
        strokeDasharray={`${arcLength} ${circumference}`}
        strokeLinecap="round" transform={rotation}
      />
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke="#00b288" strokeWidth="5"
        strokeDasharray={`${fillLength} ${circumference}`}
        strokeLinecap="round" transform={rotation}
        style={{ filter: "drop-shadow(0 0 4px rgba(0,178,136,0.8))" }}
      />
    </svg>
  )
}

function LcvgBlock({ flowLbHr, lcvgFlowNorm, fanPriRpm, fanSecRpm, blank }) {
  const fanPriPct = Math.min(100, (safeNumber(fanPriRpm) / 18) * 100)
  const fanSecPct = Math.min(100, (safeNumber(fanSecRpm) / 2.5) * 100)

  return (
    <div className="lcvg-block">
      <article className="lcvg-left">
        <p className="lcvg-title">LCVG Flow Rate</p>
        <div className="lcvg-gauge-wrap">
          <LcvgGauge norm={safeNumber(lcvgFlowNorm)} />
          <div className="lcvg-gauge-label">
            <strong>{displayValue(flowLbHr, 0, blank)}</strong>
            <span>lb/hr</span>
          </div>
        </div>
      </article>

      <article className="lcvg-right">
        <div className="fan-row">
          <div className="fan-row-header">
            <span className="fan-label">FAN (PRI)</span>
            <div className="fan-value">
              <span className="fan-num">{displayValue(fanPriRpm, 1, blank)}</span>
              <span className="fan-unit">rpm</span>
            </div>
          </div>
          <div className="fan-bar"><span style={{ width: `${fanPriPct.toFixed(1)}%` }} /></div>
        </div>
        <div className="fan-row">
          <div className="fan-row-header">
            <span className="fan-label">FAN (SEC)</span>
            <div className="fan-value">
              <span className="fan-num">{displayValue(fanSecRpm, 1, blank)}</span>
              <span className="fan-unit">rpm</span>
            </div>
          </div>
          <div className="fan-bar"><span style={{ width: `${fanSecPct.toFixed(1)}%` }} /></div>
        </div>
      </article>
    </div>
  )
}

function trendDir(series, band) {
  if (!series?.length || series.length < 2) return "flat"
  const d = series[series.length - 1] - series[series.length - 2]
  if (d > band) return "up"
  if (d < -band) return "down"
  return "flat"
}

function trendArrowSrc(dir) {
  if (dir === "up") return arrowUpward
  if (dir === "down") return arrowDownward
  return arrowForward
}

function VitalsBlock({ crewVitals, crewHistory, blank }) {
  const liveValues = [
    displayValue(crewVitals.heartRateBpm, 0, blank),
    displayValue(crewVitals.spo2, 0, blank),
    displayValue(crewVitals.coreTempF, 1, blank),
    displayValue(crewVitals.respRate, 0, blank),
  ]

  const trends = [
    trendDir(crewHistory.heartRateBpm, 1),
    trendDir(crewHistory.spo2, 0.5),
    trendDir(crewHistory.coreTempF, 0.06),
    trendDir(crewHistory.respRate, 0.5),
  ]

  return (
    <div className="vitals-container">
      <div className="vitals-grid">
        {vitalLabels.map((vital, i) => {
          const isHr = vital.label.startsWith("HR")
          const isSpo2 = vital.label.startsWith("SpO2")
          const isBodyTemp = vital.label.startsWith("Core Body")
          const isRr = vital.label.startsWith("Respiration")

          return (
            <article
              key={vital.label}
              className={`vital-card ${vital.tone} ${isHr ? "hr-card" : ""} ${isSpo2 ? "spo2-card" : ""} ${isBodyTemp ? "bodytemp-card" : ""} ${isRr ? "rr-card" : ""}`.trim()}
            >
              <p className="vital-label">{vital.label}</p>
              <div className="vital-main-row">
                <div className="vital-value-stack">
                  <h4>{liveValues[i] ?? ""}</h4>
                  <span className="vital-unit">{isBodyTemp ? "°F" : vital.unit}</span>
                </div>
                <img
                  className={`${isHr ? "hr-arrow" : isSpo2 ? "spo2-arrow" : isBodyTemp ? "bodytemp-arrow" : "rr-arrow"}`}
                  src={trendArrowSrc(trends[i])}
                  alt=""
                  aria-hidden="true"
                />
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

function EvLabel({ evLabel = "EV 1" }) {
  return (
    <div className="ev-label-row">
      <span className="ev-label-dot" aria-hidden="true" />
      <span className="ev-label-text">{evLabel}</span>
    </div>
  )
}

export function SuitsPanel({ label = "Suits 1", panelClass = "suits-panel", evLabel = "EV 1", slot = "suits1" }) {
  const { suits: s, derived, crewVitals, crewHistory, hubConnected } = useSuitsTelemetry(slot)
  const blank = !hubConnected
  const statusText = blank ? "HUB OFFLINE" : s.systemsBanner ?? "SYSTEMS NOMINAL"
  const statusClass = blank ? " system-status--alert" : s.systemsNominal ? "" : " system-status--alert"

  return (
    <Panel className={panelClass}>
      <header className="suits-title-row">
        <button type="button" className="suits-title-btn">
          <span className="suits-title-dot" aria-hidden="true" />
          {label}
        </button>
        <div className="suits-headshot-wrap">
          <img src={headshotIcon} alt="" className="suits-headshot-icon" aria-hidden="true" />
        </div>
      </header>
      <p className={`system-status${statusClass}`}>
        {statusText}
      </p>

      <O2Card
        psi={s.o2Psi}
        tank1Pct={s.o2Tank1Pct}
        tank2Pct={s.o2Tank2Pct}
        o2Segments={derived.o2Segments}
        blank={blank}
      />
      <CO2Card
        mmHg={s.co2MmHg}
        scrubberPct={s.scrubberEfficiencyPct}
        co2TankPct={s.co2Tank2Pct}
        co2Segments={derived.co2Segments}
        blank={blank}
      />
      <LcvgBlock
        flowLbHr={s.lcvgFlowLbHr}
        lcvgFlowNorm={derived.lcvgFlowNorm}
        fanPriRpm={s.fanPriRpm}
        fanSecRpm={s.fanSecRpm}
        blank={blank}
      />
      <div className="ev-label-group">
        <EvLabel evLabel={evLabel} />
        <span className={`ev-status-tag${blank ? "" : s.systemsNominal ? " ev-status-tag--nominal" : ""}`}>
          {blank ? "DISCONNECTED" : s.systemsNominal ? "NOMINAL" : "OFF-NOMINAL"}
        </span>
      </div>
      <VitalsBlock crewVitals={crewVitals} crewHistory={crewHistory} blank={blank} />
    </Panel>
  )
}
