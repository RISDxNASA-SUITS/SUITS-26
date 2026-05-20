export function AddHazardPanel({
  label,
  level,
  onLabelChange,
  onLevelChange,
  vertices,
  onClose,
  onReset,
  onDone,
}) {
  const hasVertices = vertices.length >= 3
  const hasLabel = label.trim().length > 0
  const canFinish = hasVertices
  return (
    <div className="add-poi-panel" onClick={(event) => event.stopPropagation()} onPointerDown={(event) => event.stopPropagation()}>
      <div className="add-poi-panel-inner">
        <div className="add-poi-header">
          <div className="add-poi-title-block">
            <p className="add-poi-title">Add Hazard</p>
            <p className="add-poi-coords">Click the map to add vertices</p>
          </div>
          <div className="add-poi-tag">Hazard</div>
        </div>

        <div className="add-poi-fields">
          <div className="add-poi-field">
            <label className="add-poi-label">Title</label>
            <input
              className="add-poi-input"
              value={label}
              onChange={(event) => onLabelChange(event.target.value)}
              placeholder="Enter hazard title"
            />
          </div>
          <div className="add-poi-field">
            <label className="add-poi-label">Severity</label>
            <select
              className="add-poi-input"
              value={level}
              onChange={(event) => onLevelChange(event.target.value)}
            >
              <option value="warning">Orange</option>
              <option value="danger">Red</option>
            </select>
          </div>
          <div className="add-poi-field">
            <label className="add-poi-label">Vertices</label>
            <div className="add-poi-input add-poi-input--placeholder">
              {vertices.length} vertex{vertices.length === 1 ? "" : "es"}
            </div>
          </div>
          <div className="add-poi-field">
            <label className="add-poi-label">Status</label>
            <div className="add-poi-input add-poi-input--placeholder">
              {hasVertices
                ? hasLabel
                  ? "Ready to complete hazard"
                  : "Ready to complete hazard with auto title"
                : "Add at least 3 vertices to complete"}
            </div>
          </div>
        </div>

        <div className="add-poi-actions">
          <button type="button" className="add-poi-btn-share" onClick={onReset}>
            Reset
          </button>
          <button type="button" className="add-poi-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="add-poi-btn-done"
            onClick={(event) => {
              event.stopPropagation()
              onDone?.()
            }}
            disabled={!canFinish}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
