import { useState } from "react"
import "../styles/add-task-modal.css"

export function AddTaskModal({ onSave, onCancel }) {
  const [taskName, setTaskName] = useState("")
  const [taskDescription, setTaskDescription] = useState("")

  const handleSave = () => {
    if (taskName.trim()) {
      onSave({
        title: taskName,
        description: taskDescription,
        time: "- minutes",
        sub: "- sub-tasks",
      })
      setTaskName("")
      setTaskDescription("")
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleSave()
    }
    if (e.key === "Escape") {
      onCancel()
    }
  }

  return (
    <div className="add-task-modal-overlay">
      <div className="add-task-modal">
        <h2>Add New Task</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSave()
          }}
        >
          <div className="form-group">
            <label htmlFor="task-name">Task Name</label>
            <input
              id="task-name"
              type="text"
              placeholder="Enter task name"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="task-description">Description</label>
            <textarea
              id="task-description"
              placeholder="Enter task description (optional)"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={3}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn-save" disabled={!taskName.trim()}>
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
