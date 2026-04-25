import { hudGrid2 } from '../assets/figmaAssets'

export default function HudGridOverlay() {
  return (
    <div className="absolute inset-0 opacity-10 overflow-hidden pointer-events-none rounded-[42.42px]">
      <img alt="" className="absolute h-[116.07%] left-[-6.67%] max-w-none top-[-9.4%] w-[112.02%]" src={hudGrid2} />
    </div>
  )
}