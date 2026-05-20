function formatCoords(x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return "Click anywhere on the map"
  return `${x.toFixed(1)}, ${y.toFixed(1)}`
}

export function AddPoiPanel({ draftPoi, isEditing = false, isSaving = false, onChange, onCancel, onSave }) {
  const hasLocation = Number.isFinite(draftPoi?.tssX) && Number.isFinite(draftPoi?.tssY)

  return (
    <div className="add-poi-panel">
      <div className="add-poi-panel-inner">
        <div className="add-poi-header">
          <div className="add-poi-title-block">
            <p className="add-poi-title">{isEditing ? "Edit POI" : "Add POI"}</p>
            <p className={`add-poi-coords${hasLocation ? "" : " add-poi-coords--placeholder"}`}>
              {formatCoords(draftPoi?.tssX, draftPoi?.tssY)}
            </p>
          </div>
          <div className="add-poi-tag">{draftPoi?.type ?? "PR"}</div>
        </div>

        <div className="add-poi-fields">
          <div className="add-poi-field">
            <label className="add-poi-label" htmlFor="map-poi-label">Label</label>
            <input
              id="map-poi-label"
              className="add-poi-input"
              type="text"
              value={draftPoi?.label ?? ""}
              placeholder="POI label"
              disabled={!hasLocation || isSaving}
              onChange={(event) => onChange?.({ label: event.target.value })}
            />
          </div>
          <div className="add-poi-field">
            <label className="add-poi-label" htmlFor="map-poi-notes">Notes</label>
            <textarea
              id="map-poi-notes"
              className="add-poi-input add-poi-textarea"
              value={draftPoi?.notes ?? ""}
              placeholder="Add notes..."
              disabled={!hasLocation || isSaving}
              onChange={(event) => onChange?.({ notes: event.target.value })}
            />
          </div>
          <div className="add-poi-field">
            <label className="add-poi-label">Coordinates</label>
            <div className={`add-poi-input add-poi-input--readonly${hasLocation ? "" : " add-poi-input--placeholder"}`}>
              {formatCoords(draftPoi?.tssX, draftPoi?.tssY)}
            </div>
          </div>
        </div>

        <div className="add-poi-actions">
          <button type="button" className="add-poi-btn-cancel" onClick={onCancel} disabled={isSaving}>
            Cancel
          </button>
          <button
            type="button"
            className="add-poi-btn-done"
            onClick={onSave}
            disabled={!hasLocation || isSaving}
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  )
}
