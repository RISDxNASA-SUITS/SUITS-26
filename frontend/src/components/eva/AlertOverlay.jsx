import { useState, useEffect } from "react"
import { useEvaAlertContext } from "../../context/EvaAlertContext"
import { bubbleTitle } from "../../utils/alertText"

export function AlertOverlay() {
  const { warnings, agentAlerts } = useEvaAlertContext()
  // no dropdown here; we keep minimal local state for dismissed cards
  // detailsOpen intentionally removed
  const [hidden, setHidden] = useState(new Set())

  // clear hidden set when warnings change so new alerts re-appear
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setHidden(new Set())
  }, [warnings.length, agentAlerts.length])
  /* eslint-enable react-hooks/set-state-in-effect */

  const items = [
    ...warnings.map((w) => ({ kind: "warning", key: `w-${w.code}`, ...w })),
    ...agentAlerts.map((a) => ({ kind: "agent", key: `a-${a.id}`, ...a })),
  ].filter((it) => !hidden.has(it.key))

  if (items.length === 0) return null

  return (
    <div className="eva-alert-overlay eva-alert-overlay--topright" aria-live="polite">
      <div className="eva-alert-bubbles eva-alert-bubbles--stacked" role="list" aria-label="Active alerts">
        {items.map((item) => (
          <div
            key={item.key}
            role="listitem"
            className={`eva-alert-card eva-alert-card--${item.severity || "warning"}`}
            aria-label={bubbleTitle(item)}
          >
            <div className="eva-alert-card__head">
              <strong className="eva-alert-card__title">{bubbleTitle(item)}</strong>
              <button
                type="button"
                className="eva-alert-card__close"
                aria-label="Dismiss"
                onClick={() => setHidden((s) => new Set(s).add(item.key))}
              >
                ×
              </button>
            </div>
            {item.message && <div className="eva-alert-card__body">{item.message}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}
