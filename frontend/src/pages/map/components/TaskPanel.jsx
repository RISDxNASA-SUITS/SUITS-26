import { useState } from "react"
import caretIcon from "../../../assets/map/Caret_Circle_Up.svg"
import addPlusCircleIcon from "../../../assets/map/Add_Plus_Circle.png"
import trashIcon from "../../../assets/map/Task_Trash.svg"
import expandIcon from "../../../assets/map/Expand.svg"
import shrinkIcon from "../../../assets/map/Shrink.svg"
import pathOptIcon from "../../../assets/map/Path_opt.svg"
import chevronRightIcon from "../../../assets/map/Chevron_Right.svg"
import { DPad } from "./DPad"
import { AddTaskModal } from "./AddTaskModal"
import {
  TASK_CONFIGS,
  TASK_ORDER,
  INITIAL_TASK_KEY,
  INITIAL_UPCOMING,
} from "../data/activeTaskTimeline"

export function TaskPanel({ isManual, onToggleManual, isExpanded, onToggleExpand }) {
  const [activeTab, setActiveTab] = useState("tasks")
  const [currentTaskOpen, setCurrentTaskOpen] = useState(true)
  const [currentTaskKey, setCurrentTaskKey] = useState(INITIAL_TASK_KEY)
  const [activeStep, setActiveStep] = useState(0)
  const [hasAdvanced, setHasAdvanced] = useState(false)
  const [upcomingOpen, setUpcomingOpen] = useState(true)
  const [expandedTasks, setExpandedTasks] = useState(new Set())
  const [upcomingTasks, setUpcomingTasks] = useState(INITIAL_UPCOMING)
  const [showAddTaskModal, setShowAddTaskModal] = useState(false)

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
    setShowAddTaskModal(true)
  }

  const handleSaveTask = (taskData) => {
    setUpcomingTasks(prev => [...prev, taskData])
    setShowAddTaskModal(false)
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
                        {upTask.description && (
                          <p className="upcoming-item-description">{upTask.description}</p>
                        )}
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

      {showAddTaskModal && (
        <AddTaskModal
          onSave={handleSaveTask}
          onCancel={() => setShowAddTaskModal(false)}
        />
      )}
    </aside>
  )
}
