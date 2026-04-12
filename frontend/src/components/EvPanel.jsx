import rogerPortrait from "../assets/headshot.png"
import astronautImage from "../assets/astronaut.png"
import orangePulse from "../assets/orange_pulse.png"
import greenPulse from "../assets/green_pulse.png"
import redPulse from "../assets/red_pulse.png"
import arrowUpward from "../assets/arrow_upward.svg"
import arrowDownward from "../assets/arrow_downward.svg"
import arrowForward from "../assets/arrow_forward.svg"
import { evData } from "../data/dashboardData"
import { Panel } from "./Panel"

function TrendArrow({ trend }) {
  if (trend === "stable") return <span className="trend stable">--</span>
  return <span className={`trend ${trend}`}>{trend === "up" ? "^" : "v"}</span>
}

export function EvPanel() {
  return (
    <Panel className="ev-panel">
      <header className="ev-title-row">
        <span className="ev-title-dot" aria-hidden="true">
          <span />
        </span>
        <div className="ev-title-pill">
          <h2>EV</h2>
        </div>
      </header>

      <div className="crew-card">
        <div className="avatar">
          <img src={rogerPortrait} alt={evData.name} />
        </div>
        <div className="crew-meta">
          <div className="crew-name-row">
            <h3>{evData.name}</h3>
            <span className="crew-dot" aria-hidden="true" />
          </div>
          <p>{evData.role}</p>
        </div>
      </div>

      <p className="ev-alert">{evData.alert}</p>

      <div className="astronaut-wrap">
        <div className="astronaut" aria-hidden="true">
          <img src={astronautImage} alt="" />
        </div>
      </div>

      <div className="vitals-grid">
        {evData.vitals.map((vital) => {
          const isHr = vital.label.startsWith("HR")
          const isSpo2 = vital.label.startsWith("SpO2")
          const isBodyTemp = vital.label.startsWith("Core Body")
          const isRr = vital.label.startsWith("RR")

          return (
            <article
              key={vital.label}
              className={`vital-card ${vital.tone} ${isHr ? "hr-card" : ""} ${isSpo2 ? "spo2-card" : ""} ${isBodyTemp ? "bodytemp-card" : ""} ${isRr ? "rr-card" : ""}`.trim()}
            >
              <p className="vital-label">{vital.label}</p>
              <div className="vital-main-row">
                <h4>
                  {vital.value}
                  <small>{isBodyTemp ? "°F" : vital.unit}</small>
                </h4>
                {isHr ? (
                  <img className="hr-arrow" src={arrowUpward} alt="" aria-hidden="true" />
                ) : isSpo2 ? (
                  <img className="spo2-arrow" src={arrowForward} alt="" aria-hidden="true" />
                ) : isBodyTemp ? (
                  <img className="bodytemp-arrow" src={arrowUpward} alt="" aria-hidden="true" />
                ) : isRr ? (
                  <img className="rr-arrow" src={arrowDownward} alt="" aria-hidden="true" />
                ) : (
                  <TrendArrow trend={vital.trend} />
                )}
              </div>
              {isHr ? (
                <div className="sparkline hr-sparkline">
                  <img src={orangePulse} alt="" aria-hidden="true" />
                </div>
              ) : isSpo2 ? (
                <div className="sparkline spo2-sparkline">
                  <img src={greenPulse} alt="" aria-hidden="true" />
                </div>
              ) : isBodyTemp ? (
                <div className="sparkline bodytemp-sparkline">
                  <img src={greenPulse} alt="" aria-hidden="true" />
                </div>
              ) : isRr ? (
                <div className="sparkline rr-sparkline">
                  <img src={redPulse} alt="" aria-hidden="true" />
                </div>
              ) : (
                <div className="sparkline" />
              )}
            </article>
          )
        })}
      </div>
    </Panel>
  )
}
