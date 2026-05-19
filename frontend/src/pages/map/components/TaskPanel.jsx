import { useState } from "react"
import caretIcon from "../../../assets/map/Caret_Circle_Up.svg"
import addPlusCircleIcon from "../../../assets/map/Add_Plus_Circle.png"
import trashIcon from "../../../assets/map/Task_Trash.svg"
import expandIcon from "../../../assets/map/Expand.svg"
import shrinkIcon from "../../../assets/map/Shrink.svg"
import pathOptIcon from "../../../assets/map/Path_opt.svg"
import chevronRightIcon from "../../../assets/map/Chevron_Right.svg"
import { DPad } from "./DPad"

function makeTaskConfig(title, remainingTime, steps, options = {}) {
  const { defaultActiveStep = 0, defaultHasAdvanced = false } = options
  const stepCount = steps.length
  return {
    remainingTime,
    pct: "0%",
    gridCols: `repeat(${stepCount}, 1fr)`,
    steps,
    defaultActiveStep,
    defaultHasAdvanced,
    upcomingEntry: {
      title,
      time: remainingTime.replace(/\s*min$/, " minutes"),
      sub: `${stepCount} ${stepCount === 1 ? "sub-task" : "sub-tasks"}`,
    },
  }
}

const TASK_CONFIGS = {
  "CAPCOM Setup and EVA Start": makeTaskConfig(
    "CAPCOM Setup and EVA Start",
    "— min",
    [
      "Reset all UIA switches to Down Position",
      "Reset all DCU switches to Back Position",
      "Reset LTV Task Board to pre-repair settings",
      "START EVA Telemetry (at EVA start time)",
      "Announce scenario start, give go to begin",
      "Monitor UIA Switches",
    ],
  ),
  "Connect UIA to DCU and Start Depress": makeTaskConfig(
    "Connect UIA to DCU and Start Depress",
    "1 min",
    [
      "UIA and DCU: EV1 verify umbilical connection from UIA to DCU",
      "UIA: EV1 - EMU PWR – ON",
      "DCU: BATT – UMB",
      "UIA: DEPRESS PUMP – ON",
    ],
  ),
  "Prep O2 Tanks": makeTaskConfig("Prep O2 Tanks", "3 min", [
    "UIA: OXYGEN O2 VENT – OPEN",
    "HMD: Wait until both Primary and Secondary OXY tanks are < 10 psi",
    "UIA: OXYGEN O2 VENT – CLOSE",
    "DCU: OXY – PRI",
    "UIA: OXYGEN EMU-1 – OPEN",
    "HMD: Wait until EV1 Primary O2 tank > 2950 psi",
    "UIA: OXYGEN EMU-1 – CLOSE",
    "DCU: OXY – SEC",
    "UIA: OXYGEN EMU-1 – OPEN",
    "HMD: Wait until EV1 Secondary O2 tank > 2950 psi",
    "UIA: OXYGEN EMU-1 – CLOSE",
    "DCU: OXY – PRI",
  ]),
  "Prep Coolant Tank": makeTaskConfig("Prep Coolant Tank", "1 min", [
    "DCU: PUMP – OPEN (Fill water tanks)",
    "UIA: EV-1 SUPPLY WATER – OPEN",
    "HMD: Wait until water EV1 Coolant Storage is > 95%",
    "UIA: EV-1, SUPPLY WATER – CLOSE",
  ]),
  "End Depress, Check Switches and Disconnect": makeTaskConfig(
    "End Depress, Check Switches and Disconnect",
    "2 min",
    [
      "HMD: Wait until SUIT Pressure and O2 Pressure = 4",
      "UIA: DEPRESS PUMP PWR – OFF",
      "DCU: BATT - PRI",
      "DCU: BATT – LOCAL",
      "UIA: EV-1 EMU PWR – OFF",
      "DCU: FAN – PRI",
      "DCU: PUMP – CLOSE",
      "DCU: CO2 - PRI",
      "DCU: Verify OXY – PRI",
      "EV-1 disconnect UIA and DCU umbilical",
      "Verbally announce completion of egress",
      "Begin navigation procedure",
    ],
  ),
  "Navigate to LTV Worksite": makeTaskConfig("Navigate to LTV Worksite", "3 min", [
    "Drop pin and determine best path to reach the LTV",
    "Verbally confirm the path has been generated",
    "Exit airlock and begin navigation to LTV worksite",
    "Teams may create custom procedures to showcase navigation features and AI assistant use",
    "Upon arrival at worksite, verbally confirm safe access to LTV",
  ]),
  "LTV Repair": makeTaskConfig("LTV Repair", "10 min", [
    "CAPCOM: Monitor LTV errors section in CAPCOM",
    "Verbally announce the beginning LTV diagnosis",
    "Utilize AI assistant to retrieve the Exit Recovery Mode (ERM) procedure",
    "Perform the ERM procedure and announce completion",
    "Utilize AI assistant to retrieve the NAV Restart procedure",
    "Perform the NAV Restart procedure and announce completion",
    "Utilize AI assistant to perform LTV diagnosis",
    "AI assistant retrieves relevant repair procedures from the TSS upon analysis",
    "Based on procedures provided by AI assistant, perform necessary LTV operations until all errors are resolved",
    "AI assistant relays procedures verbally or visually through the HMD",
    "Verbally announce successful repair of LTV",
    "Announce: \"LTV repairs successful, returning to PR\"",
  ]),
  "Navigate to PR Location": makeTaskConfig("Navigate to PR Location", "3 min", [
    "Drop pin and determine optimal path to reach the PR",
    "Verbally confirm path has been generated: \"Path generated, beginning navigation to PR\"",
    "Begin navigation to the PR",
    "Upon arrival at the PR, announce arrival and begin ingress",
  ]),
  "EVA Ingress": makeTaskConfig("EVA Ingress", "2 min", [
    "UIA and DCU: EV1 connect UIA and DCU umbilical",
    "UIA: EV-1 EMU PWR – ON",
    "DCU: BATT – UMB",
    "UIA: OXYGEN O2 VENT – OPEN (Vent O2 tanks)",
    "HMD: Wait until both Primary and Secondary OXY tanks are < 10 psi",
    "UIA: OXYGEN O2 VENT – CLOSE",
    "DCU: PUMP – OPEN (Empty water tanks)",
    "UIA: EV-1 WASTE WATER – OPEN",
    "HMD: Wait until water EV1 Coolant tank is < 5%",
    "UIA: EV-1, WASTE WATER – CLOSE",
    "UIA: EV-1 EMU PWR – OFF",
    "DCU: EV-1 disconnect umbilical",
  ]),
  "CAPCOM Reset for Next Team": makeTaskConfig("CAPCOM Reset for Next Team", "— min", [
    "Stop EV Telemetry",
    "Reset PR to home base",
    "Reset LTV errors, and physical task board",
    "Verify DCU and UIA are in default state",
  ]),
  "Off Nominal Procedures": makeTaskConfig("Off Nominal Procedures", "— min", [
    "Off Nominal Heart Rate: reduce activity, control breathing, resume when nominal",
    "Off Nominal Suit Oxygen Pressure: DCU OXY – SEC, return to PR",
    "Off Nominal Suit CO2 Pressure: toggle CO2 – PRI / SEC",
    "Off Nominal Suit Pressure Other: return to PR if after decompress",
    "Off Nominal Total Suit Pressure: check O2 tank and CO2 scrubber, run related procedures",
    "Off Nominal Helmet CO2 Pressure: DCU CO2 – SEC, return to PR",
    "Off Nominal Primary Fan: DCU FAN – SEC, return to PR",
    "Off Nominal CO2 Scrubber: toggle CO2 – PRI / SEC",
    "Off Nominal Temperature: reduce activity, monitor until nominal",
  ]),
}

const TASK_ORDER = Object.keys(TASK_CONFIGS)

const INITIAL_TASK_KEY = TASK_ORDER[0]

function buildUpcomingEntry(title) {
  return TASK_CONFIGS[title].upcomingEntry
}

const INITIAL_UPCOMING = TASK_ORDER.slice(1).map(buildUpcomingEntry)

export function TaskPanel({ isManual, onToggleManual, isExpanded, onToggleExpand }) {
  const [activeTab, setActiveTab] = useState("tasks")
  const [currentTaskOpen, setCurrentTaskOpen] = useState(true)
  const [currentTaskKey, setCurrentTaskKey] = useState(INITIAL_TASK_KEY)
  const [activeStep, setActiveStep] = useState(0)
  const [hasAdvanced, setHasAdvanced] = useState(false)
  const [upcomingOpen, setUpcomingOpen] = useState(true)
  const [expandedTasks, setExpandedTasks] = useState(new Set())
  const [upcomingTasks, setUpcomingTasks] = useState(INITIAL_UPCOMING)

  const [dragIndex, setDragIndex] = useState(null)

  const toggleTaskExpand = (i) => {
    setExpandedTasks(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  const handleDragStart = (i) => setDragIndex(i)
  const handleDragEnd = () => setDragIndex(null)
  const handleDragOver = (e, i) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === i) return
    setUpcomingTasks(prev => {
      const next = [...prev]
      const [moved] = next.splice(dragIndex, 1)
      next.splice(i, 0, moved)
      return next
    })
    setExpandedTasks(new Set())
    setDragIndex(i)
  }

  const task = TASK_CONFIGS[currentTaskKey]
  const currentTaskIndex = TASK_ORDER.indexOf(currentTaskKey) + 1
  const totalTasks = TASK_ORDER.length

  const advanceStep = () => {
    const lastStepIndex = task.steps.length - 1

    if (activeStep < lastStepIndex) {
      setHasAdvanced(true)
      setActiveStep(s => s + 1)
      return
    }

    if (upcomingTasks.length === 0) return

    const next = upcomingTasks[0]
    const nextConfig = TASK_CONFIGS[next.title]
    setUpcomingTasks(prev => [...prev.slice(1), task.upcomingEntry])
    if (nextConfig) {
      setCurrentTaskKey(next.title)
      setActiveStep(0)
      setHasAdvanced(false)
    }
  }

  const skipTask = () => {
    if (upcomingTasks.length === 0) return
    const next = upcomingTasks[0]
    const nextConfig = TASK_CONFIGS[next.title]
    setUpcomingTasks(prev => [...prev.slice(1), task.upcomingEntry])
    if (nextConfig) {
      setCurrentTaskKey(next.title)
      setActiveStep(nextConfig.defaultActiveStep)
      setHasAdvanced(nextConfig.defaultHasAdvanced)
    }
  }

  const addTask = () => {
    setUpcomingTasks(prev => [...prev, { title: "New Task", time: "- minutes", sub: "- sub-tasks" }])
  }

  const removeTask = (i) => {
    setUpcomingTasks(prev => prev.filter((_, idx) => idx !== i))
  }

  return (
    <aside className={`task-panel${isManual ? " task-panel--manual" : ""}`} aria-label="Task panel">
      <div className="task-big-container">
        <header className="task-panel-head">
          <p className="task-title">Tasks</p>
          <p className="task-count">{currentTaskIndex}/{totalTasks}</p>
        </header>

        <nav className="task-tabs" aria-label="Task sections">
          <button type="button" className={`task-tab ${activeTab === "tasks" ? "task-tab-active" : ""}`} onClick={() => setActiveTab("tasks")}>
            Tasks
          </button>
          <button type="button" className={`task-tab ${activeTab === "notifications" ? "task-tab-active" : ""}`} onClick={() => setActiveTab("notifications")}>
            Notifications
          </button>
        </nav>

        <div className="task-scroll-area">
          {activeTab === "notifications" && <div />}
          {activeTab === "tasks" && <><section className="current-task-section">
            <header className="current-task-header" onClick={() => setCurrentTaskOpen(o => !o)}>
              <h3 className="current-task-title">Current Task</h3>
              <button type="button" className="icon-btn" aria-label={currentTaskOpen ? "Collapse" : "Expand"}>
                <img src={caretIcon} alt="" width={28} height={28} style={{ transform: currentTaskOpen ? "none" : "rotate(180deg)", transition: "transform 0.2s" }} />
              </button>
            </header>
          </section>
          <section className="task-card" style={{ display: currentTaskOpen ? undefined : "none" }}>
            <h2>{currentTaskKey}</h2>
            <div className="task-meta">
              <span>Remaining time: {task.remainingTime}</span>
              <span>|</span>
              <span>{task.steps.length} steps</span>
              <span>|</span>
              <span>{task.pct}</span>
            </div>

            <div className="task-progress">
              <div className="progress-blocks-wrap">
                <div className="progress-blocks" aria-hidden="true" style={{ gridTemplateColumns: task.gridCols }}>
                  {task.steps.map((_, i) => {
                    let cls = ""
                    if (i === activeStep) cls = `active${hasAdvanced ? " active--advanced" : ""}`
                    else if (i < activeStep) cls = "done"
                    return <span key={i} className={cls} />
                  })}
                </div>
              </div>
            </div>

            <ol className="task-step-list">
              {task.steps.map((label, i) => {
                const cls = i < activeStep ? "step-done" : i === activeStep ? "step-current" : "step-upcoming"
                return (
                  <li key={i} className={cls}>
                    {i === activeStep ? <span className="step-dot-active" /> : <span className="step-dot" />}
                    <span className="step-text">{label}</span>
                  </li>
                )
              })}
            </ol>

            <div className="task-actions">
              <button type="button" onClick={skipTask}>Skip task</button>
              <button type="button" onClick={advanceStep}>Next Step</button>
            </div>
          </section>

          <section className="upcoming-card">
            <header className="upcoming-header">
              <h3>Upcoming Tasks ({upcomingTasks.length})</h3>
              <div className="upcoming-icons">
                <button type="button" className="add-task-btn" onClick={addTask}>
                  <img src={addPlusCircleIcon} alt="" width={18} height={18} />
                  Add Task
                </button>
                <button type="button" className="icon-btn" aria-label={upcomingOpen ? "Collapse" : "Expand"} onClick={() => setUpcomingOpen(o => !o)}>
                  <img src={caretIcon} alt="" width={28} height={28} style={{ transform: upcomingOpen ? "none" : "rotate(180deg)", transition: "transform 0.2s" }} />
                </button>
              </div>
            </header>

            {upcomingOpen && upcomingTasks.map((upTask, i) => {
              const isTaskExpanded = expandedTasks.has(i)
              const config = TASK_CONFIGS[upTask.title]
              return (
                <article
                  key={i}
                  className={`upcoming-item${dragIndex === i ? " upcoming-item--dragging" : ""}`}
                  draggable
                  onDragStart={() => handleDragStart(i)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, i)}
                >
                  <div className="upcoming-item-row">
                    <div className="upcoming-item-left">
                      <span className="upcoming-drag-handle">⋮⋮</span>
                      <div className="upcoming-item-text">
                        <p className="upcoming-item-title">{upTask.title}</p>
                        <div className="upcoming-item-meta">
                          <span>{upTask.time}</span>
                          <span className="upcoming-dot" />
                          <span>{upTask.sub}</span>
                        </div>
                      </div>
                    </div>
                    <div className="upcoming-item-actions">
                      <button type="button" className="icon-btn" aria-label="Delete" onClick={() => removeTask(i)}>
                        <img src={trashIcon} alt="" width={18} height={18} />
                      </button>
                      <button type="button" className="icon-btn" aria-label={isTaskExpanded ? "Shrink" : "Expand"} onClick={() => toggleTaskExpand(i)}>
                        <img src={isTaskExpanded ? shrinkIcon : expandIcon} alt="" width={20} height={20} />
                      </button>
                    </div>
                  </div>
                  {isTaskExpanded && config && (
                    <ol className="upcoming-step-list">
                      {config.steps.map((label, j) => (
                        <li key={j} className="upcoming-step-item">
                          <span className="upcoming-step-dot" />
                          <span className="upcoming-step-text">{label}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </article>
              )
            })}
          </section></>}
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
