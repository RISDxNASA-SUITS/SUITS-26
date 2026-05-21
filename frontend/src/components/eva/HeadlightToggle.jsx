import { useState } from "react"
import { setHeadlights } from "../../api/hubClient"

export function HeadlightToggle() {
  const [on, setOn] = useState(false)
  const [busy, setBusy] = useState(false)

  const toggle = async () => {
    const next = !on
    setOn(next)
    setBusy(true)
    try {
      // TSS HEADLIGHT_CMD (1106) expects float 1.0 for on, 0.0 for off
      await setHeadlights(next ? 1.0 : 0.0)
    } catch (err) {
      // revert on error
      setOn(!next)
      console.error("Failed to set headlights", err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="headlight-dock" aria-hidden="false">
      <button
        type="button"
        className={`headlight-toggle${on ? " headlight-toggle--on" : ""}`}
        onClick={toggle}
        disabled={busy}
        aria-pressed={on}
        aria-label={on ? "Turn headlights off" : "Turn headlights on"}
      >
        <span className="headlight-toggle__knob" aria-hidden="true" />
      </button>
      <span className="headlight-label">headlights</span>
    </div>
  )
}

export default HeadlightToggle
