import { setHubUrl } from "../../../api/hubConfig"

export function HubStatusBanner({ error }) {
  if (!error) return null

  const handleResetHub = () => {
    setHubUrl("")
    window.location.reload()
  }

  return (
    <div className="hub-status-banner" role="status">
      <span>Hub offline — showing last values. ({error})</span>
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
