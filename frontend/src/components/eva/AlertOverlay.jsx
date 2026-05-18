import { useState } from "react"
import { useEvaAlertContext } from "../../context/EvaAlertContext"
import { bubbleLabel, bubbleTitle, severityClass } from "../../utils/alertText"

export function AlertOverlay() {
  const { warnings, agentAlerts } = useEvaAlertContext()
  const [detailsOpen, setDetailsOpen] = useState(false)

  const items = [
    ...warnings.map((w) => ({ kind: "warning", key: `w-${w.code}`, ...w })),
    ...agentAlerts.map((a) => ({ kind: "agent", key: `a-${a.id}`, ...a })),
  ]

  if (items.length === 0) return null

  return (
    <div className="eva-alert-overlay" aria-live="polite">
      <div className="eva-alert-bubbles" role="list" aria-label="Active alerts">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`eva-alert-bubble ${severityClass(item)}`}
            title={bubbleTitle(item)}
            aria-label={bubbleTitle(item)}
          >
            {bubbleLabel(item)}
          </button>
        ))}
      </div>

      <div className="eva-alert-fulltext">
        <button
          type="button"
          className="eva-alert-fulltext__toggle"
          aria-expanded={detailsOpen}
          onClick={() => setDetailsOpen((open) => !open)}
        >
          <span>Alerts ({items.length})</span>
          <span className="eva-alert-fulltext__chevron" aria-hidden="true">
            {detailsOpen ? "▾" : "▸"}
          </span>
        </button>
        {detailsOpen && (
          <div className="eva-alert-fulltext__body" role="list" aria-label="Alert details">
            {items.map((item) => (
              <p
                key={`full-${item.key}`}
                className={`eva-alert-fulltext__row eva-alert-fulltext__row--${item.kind === "agent" ? "agent" : item.severity || "warning"}`}
              >
                {bubbleTitle(item)}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
