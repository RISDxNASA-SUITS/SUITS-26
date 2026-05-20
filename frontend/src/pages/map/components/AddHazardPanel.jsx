import mapCircleWarningIcon from "../../../assets/map/Map_Circle_Warning.svg"
import mapTriangleWarningIcon from "../../../assets/map/Map_Triangle_Warning.svg"

export function AddHazardPanel({
  label,
  notes,
  level,
  isEditing = false,
  onLabelChange,
  onNotesChange,
  onLevelChange,
  onDelete,
  onClose,
}) {
  const tagIcon = level === "danger" ? mapTriangleWarningIcon : mapCircleWarningIcon
  const tagLabel = level === "danger" ? "Warning" : "Caution"

  return (
    <div className="add-poi-panel" onClick={(event) => event.stopPropagation()} onPointerDown={(event) => event.stopPropagation()}>
      <div className="add-poi-panel-inner">
        <div className="add-poi-header">
          <div className="add-poi-title-block">
            <p className="add-poi-title">Add Hazard</p>
            <p className="add-poi-coords">Click the map to add vertices</p>
          </div>
          <div className="add-poi-tag">
            <img src={tagIcon} alt="" aria-hidden="true" />
            <span>{tagLabel}</span>
          </div>
        </div>

        <div className="add-poi-fields">
          <div className="add-poi-field">
            <label className="add-poi-label">Label</label>
            <input
              className="add-poi-input"
              value={label}
              onChange={(event) => onLabelChange(event.target.value)}
              placeholder="Hazard label"
            />
          </div>
          <div className="add-poi-field">
            <label className="add-poi-label">Severity</label>
            <select
              className="add-poi-input"
              value={level}
              onChange={(event) => onLevelChange(event.target.value)}
            >
              <option value="warning">Caution</option>
              <option value="danger">Warning</option>
            </select>
          </div>
          <div className="add-poi-field">
            <label className="add-poi-label">Notes</label>
            <textarea
              className="add-poi-input add-poi-textarea"
              value={notes}
              onChange={(event) => onNotesChange(event.target.value)}
              placeholder="Add notes..."
            />
          </div>
        </div>

        <div className="add-poi-actions">
          <button type="button" className="add-poi-btn-reset" onClick={onDelete}>
            Delete
          </button>
          <button type="button" className="add-poi-btn-cancel" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}
