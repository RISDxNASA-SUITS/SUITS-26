import { astronaut, profilePhoto, hudGrid2 } from '../assets/figmaAssets'
import HudGridOverlay from './HudGridOverlay'

export default function EVPanel() {
  return (
    <section className="bg-[#131418] rounded-2xl p-4 ring-2 ring-[#f2c94c]/10 relative overflow-hidden">
      <HudGridOverlay />
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm text-gray-400">EV</div>
          <div className="text-lg font-semibold">Roger Williams</div>
          <div className="text-xs text-gray-500">Crew ID 123121234</div>
        </div>
        <img src={profilePhoto} alt="profile" className="w-12 h-12 rounded-full object-cover" />
      </div>

      <div className="bg-[#0b0d10] rounded-lg p-2 flex items-center justify-center h-[420px] relative overflow-hidden">
        <div className="relative w-full h-full overflow-hidden rounded-[17px]">
          <img src={astronaut} alt="astronaut" className="absolute inset-0 w-[165%] h-full object-cover left-[-34%]" />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-xs text-gray-400">
        <div className="bg-[#0e1113] rounded-lg p-3">101<br/><span className="text-[10px] text-gray-500">HR</span></div>
        <div className="bg-[#0e1113] rounded-lg p-3">98<br/><span className="text-[10px] text-gray-500">O₂</span></div>
        <div className="bg-[#0e1113] rounded-lg p-3">CO₂ 40 mmHg</div>
      </div>
    </section>
  )
}
