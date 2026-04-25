import RoundedPanel from './RoundedPanel'
import AlertCard from './AlertCard'
import { group1101 } from '../assets/figmaAssets'
import HudGridOverlay from './HudGridOverlay'

export default function InfoBanner() {
  return (
    <div className="mt-6 max-w-6xl mx-auto relative">
      <RoundedPanel className="p-6 flex items-center justify-between relative overflow-hidden">
        <HudGridOverlay />
        <div className="flex-1 pr-6">
          <div className="text-sm text-white leading-[1.3]">
            <p>Coolant flow below 0.8 L/min</p>
            <p>→ Suit Temp 104 °F.</p>
          </div>
          <p className="italic text-xs text-gray-400 mt-2">Recommendation: verify pump & loop valves.</p>
          <div className="mt-4 w-40 h-4">
            <img src={group1101} alt="progress" className="w-full h-full object-contain" />
          </div>
        </div>

        <div className="w-48 flex-shrink-0 ml-4">
          <AlertCard />
        </div>
      </RoundedPanel>
    </div>
  )
}
