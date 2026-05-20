import { useMemo, useState, useContext } from "react"
import { getHubUrl } from "../api/hubConfig"
import { HubConfigContext } from "../context/HubConfigContext"

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0, 0, 0, 0.75)",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 2000,
  padding: "20px",
}

const panelStyle = {
  width: "min(600px, 100%)",
  background: "#111",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: "16px",
  padding: "28px",
  boxShadow: "0 20px 80px rgba(0,0,0,0.6)",
}

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  marginTop: "12px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.18)",
  background: "#0f0f0f",
  color: "#fff",
  fontSize: "1rem",
}

const buttonStyle = {
  marginTop: "18px",
  padding: "12px 18px",
  borderRadius: "10px",
  border: "none",
  cursor: "pointer",
  fontWeight: 600,
}

export function HubIpPrompt({ open, onDismiss }) {
  const ctx = useContext(HubConfigContext)
  const savedValue = useMemo(() => getHubUrl().replace(/^https?:\/\//i, ""), [])
  const [value, setValue] = useState(savedValue)

  if (!open) return null

  const handleSubmit = (event) => {
    event.preventDefault()
    ctx?.handleSaveHubUrl(value)
    onDismiss()
  }

  const handleContinueWithout = () => {
    ctx?.handleSaveHubUrl("")
    onDismiss()
  }

  return (
    <div style={overlayStyle} role="dialog" aria-modal="true" aria-label="Java Hub connection setup">
      <div style={panelStyle}>
        <h2 style={{ margin: 0, fontSize: "1.5rem" }}>Java Hub IP or URL</h2>
        <p style={{ margin: "12px 0 0", color: "#ccc" }}>
          Enter the Java Hub host and port for live telemetry, for example <strong>172.17.34.233:7070</strong> or <strong>http://localhost:7070</strong>.
        </p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="hub-url-input" style={{ display: "block", marginTop: "20px", color: "#ddd" }}>
            Hub address
          </label>
          <input
            id="hub-url-input"
            style={inputStyle}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="localhost:7070"
            autoFocus
          />
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button type="submit" style={{ ...buttonStyle, background: "#06f", color: "#fff" }}>
              Connect
            </button>
            <button
              type="button"
              onClick={handleContinueWithout}
              style={{ ...buttonStyle, background: "rgba(255,255,255,0.08)", color: "#fff" }}
            >
              Continue without hub
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
