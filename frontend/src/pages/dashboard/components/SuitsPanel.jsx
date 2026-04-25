import { evData } from "../data/dashboardData"
import { useSuitsTelemetry } from "../../../hooks/useSuitsTelemetry"
import { Panel } from "./Panel"
import orangePulse from "../../../assets/dashboard/orange_pulse.png"
import greenPulse from "../../../assets/dashboard/green_pulse.png"
import redPulse from "../../../assets/dashboard/red_pulse.png"
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

function O2Card({ psi, tank1Pct, tank2Pct, o2Segments }) {
  const o2BarCount = 13
  const activeCount = Math.round((o2Segments / 15) * o2BarCount)

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
          <strong>{psi.toFixed(1)}</strong>
          <span>psi</span>
        </p>
      </div>

      <div className="o2-tanks-row">
        <div className="o2-tank-card">
          <span className="tank-card-label">Tank 1</span>
          <div className="tank-card-value">
            <span className="tank-card-num">{Math.round(tank1Pct)}</span>
            <span className="tank-card-unit">%</span>
          </div>
        </div>
        <div className="o2-tank-card">
          <span className="tank-card-label">Tank 2</span>
          <div className="tank-card-value">
            <span className="tank-card-num">{Math.round(tank2Pct)}</span>
            <span className="tank-card-unit">%</span>
          </div>
        </div>
      </div>

    </div>
  )
}

function CO2Card({ mmHg, scrubberPct, co2TankPct, co2Segments }) {
  const co2BarCount = 13
  const activeCount = Math.round((co2Segments / 15) * co2BarCount)

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
          <strong>{mmHg.toFixed(1)}</strong>
          <span>mmHg</span>
        </p>
      </div>

      <div className="o2-tanks-row">
        <div className="o2-tank-card">
          <span className="tank-card-label">Scrubber A</span>
          <div className="tank-card-value">
            <span className="tank-card-num">{Math.round(scrubberPct)}</span>
            <span className="tank-card-unit">%</span>
          </div>
        </div>
        <div className="o2-tank-card">
          <span className="tank-card-label">Scrubber B</span>
          <div className="tank-card-value">
            <span className="tank-card-num">{Math.round(co2TankPct)}</span>
            <span className="tank-card-unit">%</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function LcvgBlock({ flowLbHr, lcvgFlowNorm, fanPriRpm, fanSecRpm }) {
  const fanPriPct = Math.min(100, (fanPriRpm / 18) * 100)
  const fanSecPct = Math.min(100, (fanSecRpm / 2.5) * 100)

  return (
    <div className="lcvg-block">
      <article className="lcvg-left">
        <p className="lcvg-title">LCVG Flow Rate</p>
        <div className="lcvg-bar-row">
          <div className="lcvg-bar">
            <div className="lcvg-bar-fill" style={{ height: `${Math.round(lcvgFlowNorm * 100)}%` }} />
          </div>
          <div className="lcvg-bar-label">
            <strong>{Math.round(flowLbHr)}</strong>
            <span>lb/hr</span>
          </div>
        </div>
      </article>

      <article className="lcvg-right">
        <div className="fan-row">
          <div className="fan-row-header">
            <span className="fan-label">FAN (PRI)</span>
            <div className="fan-value">
              <span className="fan-num">{fanPriRpm.toFixed(1)}</span>
              <span className="fan-unit">rpm</span>
            </div>
          </div>
          <div className="fan-bar"><span style={{ width: `${fanPriPct.toFixed(1)}%` }} /></div>
        </div>
        <div className="fan-row">
          <div className="fan-row-header">
            <span className="fan-label">FAN (SEC)</span>
            <div className="fan-value">
              <span className="fan-num">{fanSecRpm.toFixed(1)}</span>
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

function VitalsBlock({ crewVitals, crewHistory }) {
  const liveValues = [
    Math.round(crewVitals.heartRateBpm),
    Math.round(crewVitals.spo2),
    crewVitals.coreTempF.toFixed(1),
    Math.round(crewVitals.respRate),
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
      {evData.vitals.map((vital, i) => {
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
                <h4>{liveValues[i]}</h4>
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
      <div className="ev-label-avatar">
        <img src={headshotIcon} alt="" className="ev-label-icon" aria-hidden="true" />
      </div>
    </div>
  )
}

export function SuitsPanel({ label = "Suits 1", panelClass = "suits-panel", evLabel = "EV 1", slot = "suits1" }) {
  const { suits: s, derived, crewVitals, crewHistory } = useSuitsTelemetry(slot)

  return (
    <Panel className={panelClass}>
      <header className="suits-title-row">
        <button type="button" className="suits-title-btn">
          <span className="suits-title-dot" aria-hidden="true" />
          {label}
        </button>
      </header>
      <p className="system-status">SYSTEMS NOMINAL</p>

      <O2Card
        psi={s.o2Psi}
        tank1Pct={s.o2Tank1Pct}
        tank2Pct={s.o2Tank2Pct}
        o2Segments={derived.o2Segments}
      />
      <CO2Card
        mmHg={s.co2MmHg}
        scrubberPct={s.scrubberEfficiencyPct}
        co2TankPct={s.co2Tank2Pct}
        co2Segments={derived.co2Segments}
      />
      <LcvgBlock
        flowLbHr={s.lcvgFlowLbHr}
        lcvgFlowNorm={derived.lcvgFlowNorm}
        fanPriRpm={s.fanPriRpm}
        fanSecRpm={s.fanSecRpm}
      />
      <EvLabel evLabel={evLabel} />
      <p className="crew-id">Crew ID 1231231243</p>
      <VitalsBlock crewVitals={crewVitals} crewHistory={crewHistory} />
    </Panel>
  )
}
