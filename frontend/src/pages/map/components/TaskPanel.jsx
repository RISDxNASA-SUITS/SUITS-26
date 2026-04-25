import caretIcon from "../../../assets/map/Caret_Circle_Up.svg"
import addPlusCircleIcon from "../../../assets/map/Add_Plus_Circle.png"
import trashIcon from "../../../assets/map/Task_Trash.svg"
import expandIcon from "../../../assets/map/Expand.svg"
import dotsIcon from "../../../assets/map/dots.png"
import pathOptIcon from "../../../assets/map/Path_opt.svg"
import chevronRightIcon from "../../../assets/map/Chevron_Right.svg"
import { DPad } from "./DPad"

export function TaskPanel({ isManual, onToggleManual, isExpanded, onToggleExpand }) {
  return (
    <aside className={`task-panel${isManual ? " task-panel--manual" : ""}`} aria-label="Task panel">
      <div className="task-big-container">
        <header className="task-panel-head">
          <p className="task-title">Tasks</p>
          <p className="task-count">2/6</p>
        </header>

        <nav className="task-tabs" aria-label="Task sections">
          <button type="button" className="task-tab task-tab-active">
            Tasks
          </button>
          <button type="button" className="task-tab">
            Notifications
          </button>
        </nav>

        <div className="task-scroll-area">
          <section className="task-card">
            <h2>Execute LTV Search Pattern</h2>
            <div className="task-meta">
              <span>Estimated time: 45 min</span>
              <span>6 sub-tasks</span>
            </div>

            <div className="task-progress">
              <div className="progress-blocks-wrap">
                <div className="progress-blocks" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                  <span className="active" />
                  <span />
                  <span />
                </div>
              </div>
              <div className="task-progress-meta">
                <span>Remaining time: 25 min</span>
                <span>56%</span>
              </div>
            </div>

            <ol className="task-step-list">
              <li className="step-done">
                <span className="step-dot" />
                <span className="step-text">Generate Search Pattern</span>
              </li>
              <li className="step-done">
                <span className="step-dot" />
                <span className="step-text">Broadcast LTV wake up signal</span>
              </li>
              <li className="step-done">
                <span className="step-dot" />
                <span className="step-text">Navigate Search Waypoints</span>
              </li>
              <li className="step-current">
                <span className="step-dot-active" />
                <span className="step-text">Detect Beacon Response &lt;500m</span>
              </li>
              <li className="step-upcoming">
                <span className="step-dot" />
                <span className="step-text">Confirm LTV location</span>
              </li>
              <li className="step-upcoming">
                <span className="step-dot" />
                <span className="step-text">Navigate PR to LTV site</span>
              </li>
            </ol>

            <div className="task-actions">
              <button type="button">Skip task</button>
              <button type="button">Next Step</button>
            </div>
          </section>

          <section className="upcoming-card">
            <header className="upcoming-header">
              <h3>Upcoming Tasks (3)</h3>
              <div className="upcoming-icons">
                <button type="button" className="icon-btn" aria-label="Expand">
                  <img src={caretIcon} alt="" width={28} height={28} />
                </button>
              </div>
            </header>

            <button type="button" className="add-task-btn">
              <img src={addPlusCircleIcon} alt="" width={18} height={18} />
              Add Task
            </button>

            {[
              { title: "Point A Terrain Scan", time: "45 minutes", sub: "4 sub-tasks" },
              { title: "Point A Terrain Scan", time: "45 minutes", sub: "4 sub-tasks" },
              { title: "Point A Terrain Scan", time: "45 minutes", sub: "4 sub-tasks" },
            ].map((task, i) => (
              <article key={i} className="upcoming-item">
                <div className="upcoming-item-left">
                  <span className="upcoming-drag-handle">⋮⋮</span>
                  <div className="upcoming-item-text">
                    <p className="upcoming-item-title">{task.title}</p>
                    <div className="upcoming-item-meta">
                      <span>{task.time}</span>
                      <span className="upcoming-dot" />
                      <span>{task.sub}</span>
                    </div>
                  </div>
                </div>
                <div className="upcoming-item-actions">
                  <button type="button" className="icon-btn" aria-label="Delete">
                    <img src={trashIcon} alt="" width={18} height={18} />
                  </button>
                  <button type="button" className="icon-btn" aria-label="Expand">
                    <img src={expandIcon} alt="" width={20} height={20} />
                  </button>
                </div>
              </article>
            ))}
          </section>
        </div>
      </div>

      <section className={`path-opt-card${isExpanded ? " path-opt-card--hidden" : ""}`}>
        <div className="path-opt-left">
          <div className="path-opt-header">
            <img src={pathOptIcon} alt="" className="path-opt-icon" />
            <div>
              <h3 className="path-opt-title">Path Optimization</h3>
              <p className="path-opt-status">
                {isManual ? "Manual • Inactive" : "Auto • Active • Route Optimized"}
              </p>
            </div>
          </div>
          <div className="path-opt-actions">
            <button
              type="button"
              className={`path-btn ${!isManual ? "path-btn-active" : ""}`}
              onClick={() => onToggleManual(false)}
            >
              Auto
            </button>
            <button
              type="button"
              className={`path-btn ${isManual ? "path-btn-active" : ""}`}
              onClick={() => onToggleManual(true)}
            >
              Manual
            </button>
          </div>
          {isManual && <DPad />}
        </div>
        {!isManual && (
          <button type="button" className="path-opt-chevron" aria-label="Expand" onClick={onToggleExpand}>
            <img src={chevronRightIcon} alt="" width={32} height={32} />
          </button>
        )}
      </section>
    </aside>
  )
}
