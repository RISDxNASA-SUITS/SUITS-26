import { useEffect, useMemo, useState } from "react"
import { useHubConfigContext } from "../../../context/HubConfigContext"

export function HubStatusBanner({ restError }) {
  const { isHubConfigured, wsStatus, wsError, liveTelemetry, clearHubUrl } = useHubConfigContext()
  const [dismissed, setDismissed] = useState(false)

  const wsLabel =
    wsStatus === "open"
      ? "WebSocket connected"
      : wsStatus === "connecting"
        ? "WebSocket connecting..."
        : wsStatus === "error"
          ? `WebSocket error${wsError ? `: ${wsError}` : ""}`
          : wsStatus === "closed"
            ? "WebSocket disconnected (reconnecting...)"
            : "WebSocket idle"

  const tssOk = liveTelemetry?.tssConnected === true
  const tssLabel =
    wsStatus === "open"
      ? tssOk
        ? "TSS connected"
        : `TSS offline${liveTelemetry?.error ? `: ${liveTelemetry.error}` : ""}`
      : null

  const showBanner =
    !isHubConfigured
      ? Boolean(restError)
      : Boolean(restError || wsStatus !== "open" || (wsStatus === "open" && liveTelemetry && !tssOk))

  const message = useMemo(() => {
    if (!isHubConfigured) {
      return restError ?? ""
    }

    return [
      restError,
      wsLabel,
      tssLabel,
      !restError && wsStatus !== "open" ? "showing last values" : null,
    ]
      .filter(Boolean)
      .join(" · ")
  }, [isHubConfigured, restError, wsLabel, tssLabel, wsStatus])

  useEffect(() => {
    setDismissed(false)
  }, [message])

  if (!showBanner || !message || dismissed) return null

  const handleResetHub = () => {
    clearHubUrl()
    window.location.reload()
  }

  return (
    <div className="hub-status-banner" role="status">
      <span className="hub-status-banner__text">{message}</span>
      <div className="hub-status-banner__actions">
        <button type="button" className="hub-status-banner__btn" onClick={handleResetHub}>
          Reset Hub
        </button>
        <button
          type="button"
          className="hub-status-banner__btn hub-status-banner__btn--close"
          onClick={() => setDismissed(true)}
        >
          Close
        </button>
      </div>
    </div>
  )
}
