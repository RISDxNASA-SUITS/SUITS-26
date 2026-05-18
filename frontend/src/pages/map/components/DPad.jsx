import controllerArrow from "../../../assets/map/controller-arrow.svg"

export function DPad() {
  return (
    <div className="dpad-container" aria-label="Manual directional control">
      <button type="button" className="dpad-btn dpad-up" aria-label="Up">
        <img src={controllerArrow} alt="" width={58} height={58} />
      </button>
      <button type="button" className="dpad-btn dpad-right" aria-label="Right">
        <img src={controllerArrow} alt="" width={58} height={58} style={{ transform: "rotate(90deg)" }} />
      </button>
      <button type="button" className="dpad-btn dpad-down" aria-label="Down">
        <img src={controllerArrow} alt="" width={58} height={58} style={{ transform: "rotate(180deg)" }} />
      </button>
      <button type="button" className="dpad-btn dpad-left" aria-label="Left">
        <img src={controllerArrow} alt="" width={58} height={58} style={{ transform: "rotate(270deg)" }} />
      </button>
      <div className="dpad-center" aria-hidden="true" />
    </div>
  )
}
