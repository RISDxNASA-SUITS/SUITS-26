import controllerArrow from "../../../assets/map/controller-arrow.svg"

export function DPad({ onCommandStart, onCommandEnd, onStop }) {
  const bindCommand = (command) => ({
    onContextMenu: (event) => event.preventDefault(),
    onPointerDown: (event) => {
      event.preventDefault()
      event.currentTarget.setPointerCapture?.(event.pointerId)
      onCommandStart?.(command)
    },
    onPointerUp: (event) => {
      event.preventDefault()
      event.currentTarget.releasePointerCapture?.(event.pointerId)
      onCommandEnd?.()
    },
    onPointerCancel: () => onCommandEnd?.(),
    onLostPointerCapture: () => onCommandEnd?.(),
  })

  return (
    <div className="dpad-container" aria-label="Manual directional control">
      <button type="button" className="dpad-btn dpad-up" aria-label="Drive forward" {...bindCommand("forward")}>
        <img src={controllerArrow} alt="" width={58} height={58} />
      </button>
      <button type="button" className="dpad-btn dpad-right" aria-label="Turn right" {...bindCommand("right")}>
        <img src={controllerArrow} alt="" width={58} height={58} style={{ transform: "rotate(90deg)" }} />
      </button>
      <button type="button" className="dpad-btn dpad-down" aria-label="Drive backward" {...bindCommand("reverse")}>
        <img src={controllerArrow} alt="" width={58} height={58} style={{ transform: "rotate(180deg)" }} />
      </button>
      <button type="button" className="dpad-btn dpad-left" aria-label="Turn left" {...bindCommand("left")}>
        <img src={controllerArrow} alt="" width={58} height={58} style={{ transform: "rotate(270deg)" }} />
      </button>
      <button type="button" className="dpad-center" aria-label="Stop rover" onClick={() => onStop?.()} />
    </div>
  )
}
