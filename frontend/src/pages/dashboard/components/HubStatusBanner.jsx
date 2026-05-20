import { useHubConfigContext } from "../../../context/HubConfigContext"

export function HubStatusBanner({ restError }) {
  const { isHubConfigured, wsStatus, wsError, liveTelemetry, clearHubUrl } = useHubConfigContext()

  if (!isHubConfigured) {
    if (!restError) return null
    return (
      <div className="hub-status-banner" role="status">
        <span>{restError}</span>
      </div>
    )
  }

  const wsLabel =
    wsStatus === "open"
      ? "WebSocket connected"
      : wsStatus === "connecting"
        ? "WebSocket connecting…"
        : wsStatus === "error"
          ? `WebSocket error${wsError ? `: ${wsError}` : ""}`
          : wsStatus === "closed"
            ? "WebSocket disconnected (reconnecting…)"
            : "WebSocket idle"

  const tssOk = liveTelemetry?.tssConnected === true
  const tssLabel =
    wsStatus === "open"
      ? tssOk
        ? "TSS connected"
        : `TSS offline${liveTelemetry?.error ? `: ${liveTelemetry.error}` : ""}`
      : null

  const showBanner =
    restError || wsStatus !== "open" || (wsStatus === "open" && liveTelemetry && !tssOk)

  if (!showBanner) return null

  const handleResetHub = () => {
    clearHubUrl()
    window.location.reload()
  }

  return (
    <div className="hub-status-banner" role="status">
      <span>
        {restError && <>{restError} · </>}
        {wsLabel}
        {tssLabel && <> · {tssLabel}</>}
        {!restError && wsStatus !== "open" && " — showing last values"}
      </span>
      <button
        type="button"
        onClick={handleResetHub}
        style={{
          marginLeft: "12px",
          padding: "6px 10px",
          borderRadius: "8px",
          border: "1px solid rgba(255,255,255,0.14)",
          background: "rgba(255,255,255,0.08)",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        Reset Hub
      </button>
    </div>
  )
}
