export function AddHazardPanel({ onClose }) {
  return (
    <div className="add-poi-panel">
      <div className="add-poi-panel-inner">
        <div className="add-poi-header">
          <div className="add-poi-title-block">
            <p className="add-poi-title">Add Hazard</p>
            <p className="add-poi-coords">38.847185, -77.333624</p>
          </div>
          <div className="add-poi-tag">PR</div>
        </div>

        <div className="add-poi-fields">
          <div className="add-poi-field">
            <label className="add-poi-label">Label</label>
            <div className="add-poi-input">POI 12</div>
          </div>
          <div className="add-poi-field">
            <label className="add-poi-label">Notes</label>
            <div className="add-poi-input add-poi-input--placeholder">Add Notes...</div>
          </div>
          <div className="add-poi-field">
            <label className="add-poi-label">Coordinates</label>
            <div className="add-poi-input">38.847185, -77.333624</div>
          </div>
        </div>

        <div className="add-poi-actions">
          <button type="button" className="add-poi-btn-share">Share</button>
          <button type="button" className="add-poi-btn-cancel" onClick={onClose}>Cancel</button>
          <button type="button" className="add-poi-btn-done">Done</button>
        </div>
      </div>
    </div>
  )
}
