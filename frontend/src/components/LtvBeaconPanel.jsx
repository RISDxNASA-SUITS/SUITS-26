import { useEffect, useState } from 'react'
import { ltvBeaconMock } from '../mock/ltvBeaconMock'
import LtvDirectionalBearing from './LtvDirectionalBearing'

const imgEllipse796 =
  'https://www.figma.com/api/mcp/asset/cfd05532-b665-4fab-9e9e-4baf67449f3d'
const imgEllipse797 =
  'https://www.figma.com/api/mcp/asset/f7430ac3-b7dc-413e-a015-2906f9701eb9'
const imgLine672 =
  'https://www.figma.com/api/mcp/asset/147862d7-eaa9-4ed2-b600-7f677ab3dfb4'
const imgLine673 =
  'https://www.figma.com/api/mcp/asset/d63635cd-ab43-49a8-99ba-aa0a42161a2a'
const imgArrow95 =
  'https://www.figma.com/api/mcp/asset/3892e585-8ed8-492a-916e-93e915e0d683'
const imgFrame427319083 =
  'https://www.figma.com/api/mcp/asset/82a3b495-92c7-4a34-9e7a-81a53ada4818'
const imgMarsRoverBlackAndWhiteClipart1 =
  'https://www.figma.com/api/mcp/asset/863037aa-1767-4bef-8d24-179dbd6d7b95'
const imgImage105 =
  'https://www.figma.com/api/mcp/asset/3b922ba6-6853-44d0-9be0-10e16a135870'
/**
 * Figma `7383:106443` — LTV Beacon column with mock-driven telemetry (Crit / Suits dashboard).
 * @param {{ className?: string }} props
 */
export default function LtvBeaconPanel({ className = '' }) {
  const [snap, setSnap] = useState(() => ltvBeaconMock.getSnapshot())
  useEffect(() => ltvBeaconMock.subscribe(setSnap), [])

  const distPct = Math.min(100, (snap.distanceNearM / Math.max(snap.distanceFarM, 1)) * 100)
  const bottomPct = Math.min(100, (snap.bottomDistanceM / Math.max(snap.bottomGoalM, 1)) * 100)
  const riskColor = snap.envRiskStable ? '#00ffae' : '#ffa600'
  const locOpacity = 0.82 + 0.18 * Math.sin(snap.locateElapsedSeconds * 0.12)

  return (
    <div
      className={`border-[1.042px] border-solid border-black bg-[var(--midnight-blue,#060f1c)] text-[14px] text-white ${className}`}
      data-node-id="5758:27353"
      data-figma-node-id="7383:106443"
      data-name="Auto-layouted version"
    >
      <div
        className="absolute overflow-clip rounded-[18.762px] border-[1.303px] border-solid border-[var(--royal-blue,#191f3c)]"
        style={{ height: '554px', left: '484.96px', top: '155.96px', width: '314px' }}
        data-node-id="7383:106444"
      >
        <div className="absolute left-[9.12px] top-[315.57px] h-[131.336px] w-[292.899px]" data-node-id="7383:106445" />
        <p
          className="absolute left-[16.42px] top-[28.63px] w-[240px] font-['IBM_Plex_Sans',sans-serif] text-[14px] leading-normal not-italic text-[color:var(--moon-blue,#526d82)]"
          data-node-id="7383:106446"
          style={{ fontFeatureSettings: "'zero' 1" }}
        >
          <span>Distance to Beacon: </span>
          <span className="text-[#00b288] transition-colors duration-300">{snap.distanceNearM} m</span>
          <span>{` / ${snap.distanceFarM} m`}</span>
        </p>
        <p
          className="absolute left-[16.42px] top-[11.63px] w-[240px] font-['IBM_Plex_Sans',sans-serif] text-[14px] leading-normal not-italic text-[color:var(--moon-blue,#526d82)]"
          data-node-id="7383:106447"
          style={{ fontFeatureSettings: "'zero' 1" }}
        >
          LTV Location:
          <span
            className="text-[#00b288] transition-opacity duration-300"
            style={{ opacity: snap.ltvLocationDetected ? locOpacity : 0.45 }}
          >
            {snap.ltvLocationDetected ? ' Detected' : ' Acquiring…'}
          </span>
        </p>
        <div className="absolute left-[19.7px] top-[423.7px] contents" data-node-id="7383:106448">
          <div className="absolute left-[22.92px] top-[425px] contents" data-node-id="7383:106449">
            <div
              className="absolute left-[7.3%] right-[89.05%] top-[429.17px] aspect-[1/1] animate-pulse"
              data-node-id="7383:106450"
            >
              <img alt="" className="absolute inset-0 block size-full max-w-none" src={imgEllipse796} />
            </div>
            <div className="absolute left-[40.8px] top-[425px] h-[18.762px] w-[262.671px]" data-node-id="7383:106451">
              <div className="absolute left-0 top-0 contents font-['IBM_Plex_Sans',sans-serif] text-[14.593px] not-italic leading-normal">
                <p className="absolute left-0 top-0 h-[18.762px] w-[115.427px] text-white" data-node-id="7383:106453" style={{ fontFeatureSettings: "'zero' 1" }}>
                  TRACKING:{' '}
                </p>
                <p
                  className="absolute left-[245.99px] top-0 h-[18.433px] w-[115.258px] -translate-x-full text-right text-[color:var(--moon-dust,#6b8bae)] transition-all duration-300"
                  data-node-id="7383:106454"
                  style={{ fontFeatureSettings: "'zero' 1" }}
                >
                  {snap.trackingBeaconId}
                </p>
              </div>
            </div>
          </div>
          <div className="absolute left-[21px] top-[458.36px] contents" data-node-id="7383:106455">
            <div className="absolute left-[21px] top-[459.4px] size-[15.635px]" data-node-id="5758:27366" data-name="Component 4">
              <div className="absolute left-[33.33%] right-[33.33%] top-[5.21px] aspect-[5/5]" data-node-id="I7383:106456;5148:9533">
                <img alt="" className="absolute inset-0 block size-full max-w-none" src={imgEllipse797} />
              </div>
              <div className="absolute inset-[53.33%_0_46.67%_0]" data-node-id="I7383:106456;5148:9534">
                <div className="absolute inset-[-1.04px_0_0_0]">
                  <img alt="" className="block size-full max-w-none" src={imgLine672} />
                </div>
              </div>
              <div
                className="absolute inset-[0_46.67%_0_53.33%] flex items-center justify-center"
                style={{ containerType: 'size' }}
              >
                <div className="h-[1px] w-[100cqh] flex-none -rotate-90">
                  <div className="relative size-full" data-node-id="I7383:106456;5148:9535">
                    <div className="absolute inset-[-1.04px_0_0_0]">
                      <img alt="" className="block size-full max-w-none" src={imgLine673} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute left-[40.8px] top-[458.36px] contents" data-node-id="7383:106457">
              <div className="absolute left-[40.8px] top-[458.36px] h-[18.762px] w-[262.671px]" data-node-id="7383:106458">
                <div className="absolute left-0 top-0 contents font-['IBM_Plex_Sans',sans-serif] text-[14.593px] not-italic leading-normal">
                  <p className="absolute left-0 top-0 h-[18.762px] w-[127.166px] text-white" data-node-id="7383:106460" style={{ fontFeatureSettings: "'zero' 1" }}>
                    CENTER
                  </p>
                  <p
                    className="absolute left-[245.99px] top-0 h-[18.433px] w-[115.258px] -translate-x-full text-right text-[color:var(--moon-dust,#6b8bae)]"
                    data-node-id="7383:106461"
                    style={{ fontFeatureSettings: "'zero' 1" }}
                  >
                    {snap.centerLabel}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute left-[28.3px] top-[491.71px] contents" data-node-id="7383:106462">
            <div className="absolute left-[28.3px] top-[494.84px] flex h-[12.508px] w-0 items-center justify-center">
              <div
                className="h-0 w-[12.508px] flex-none transition-transform duration-700 ease-out"
                style={{ transform: `rotate(${snap.bearingDeg - 90}deg)` }}
              >
                <div className="relative h-0 w-[12.508px]">
                  <div className="absolute inset-[-3.84px_-4.17%_-3.84px_0]">
                    <img alt="" className="block size-full max-w-none" src={imgArrow95} />
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute left-[40.8px] top-[491.71px] contents" data-node-id="7383:106464">
              <div className="absolute left-[40.8px] top-[491.71px] h-[18.762px] w-[262.671px]" data-node-id="7383:106465">
                <div className="absolute left-0 top-0 contents font-['IBM_Plex_Sans',sans-serif] text-[14.593px] not-italic leading-normal">
                  <p className="absolute left-0 top-0 h-[18.762px] w-[127.166px] text-white" data-node-id="7383:106467" style={{ fontFeatureSettings: "'zero' 1" }}>
                    DIRECTION
                  </p>
                  <p
                    className="absolute left-[245.99px] top-0 h-[18.433px] w-[115.258px] -translate-x-full text-right text-[color:var(--moon-dust,#6b8bae)]"
                    data-node-id="7383:106468"
                    style={{ fontFeatureSettings: "'zero' 1" }}
                  >
                    {snap.directionRowSub}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <LtvDirectionalBearing bearingDeg={snap.bearingDeg} className="absolute left-[26.7px] top-[92.7px] h-[266px] w-[258px]" />
      </div>

      <div
        className="absolute overflow-clip rounded-[8.339px] bg-gradient-to-b from-[var(--royal-blue,#191f3c)] via-[rgba(82,109,130,0.1)] to-[rgba(26,61,100,0.7)]"
        style={{ height: '62.541px', left: '31.27px', top: '72.96px', width: '774.463px' }}
        data-node-id="7383:106470"
      >
        <div className="absolute left-[27.1px] top-[21.89px] contents font-['IBM_Plex_Sans',sans-serif] not-italic" data-node-id="7383:106471">
          <p
            className="absolute left-[27.1px] top-[21.89px] h-[18.762px] w-[248.078px] text-[0px] leading-[0] text-[color:var(--moon-dust,#6b8bae)]"
            data-node-id="7383:106472"
            style={{ fontFeatureSettings: "'zero' 1" }}
          >
            <span className="text-[14.593px] leading-normal">CURRENT MODE: </span>
            <span className="text-[14.593px] leading-normal text-white">{snap.currentMode}</span>
          </p>
          <p
            className="absolute left-[732.77px] top-[21.89px] h-[18.762px] w-[451.336px] -translate-x-full text-right text-[14px] font-normal leading-normal text-[#00ff4d] transition-colors duration-300"
            data-node-id="7383:106473"
            style={{ fontFeatureSettings: "'zero' 1" }}
          >
            Duration: {snap.formattedDuration}
          </p>
        </div>
      </div>

      <div className="absolute left-[23.97px] top-[22.93px] flex items-center gap-[10.423px]" data-node-id="7383:106474">
        <div
          className="relative flex h-[26.059px] w-[27.101px] shrink-0 items-center justify-center"
          data-node-id="7383:106475"
        >
          {/* Figma `7383:106476` Ellipse 740 — procedural dot (no raster) */}
          <div
            className="shrink-0 rounded-full bg-[var(--Confirmation,#00B288)]"
            style={{ width: '18.762px', height: '18.762px' }}
            data-node-id="7383:106476"
            aria-hidden
          />
        </div>
        <div
          className="relative shrink-0 rounded-[12.508px] border border-solid border-[#b9d3cd] px-[27.524px] py-[3.441px] opacity-80"
          style={{ borderWidth: '1.032px' }}
          data-node-id="7383:106477"
        >
          <p
            className="whitespace-nowrap font-['IBM_Plex_Sans',sans-serif] text-[20.847px] font-medium not-italic leading-normal text-[#b9d3cd]"
            data-node-id="7383:106478"
          >
            LTV Beacon
          </p>
        </div>
      </div>

      <div
        className="absolute overflow-clip rounded-[8.339px] border-[1.042px] border-solid border-[var(--royal-blue,#191f3c)] bg-gradient-to-b from-[var(--royal-blue,#191f3c)] via-[rgba(82,109,130,0.1)] to-[rgba(26,61,100,0.7)]"
        style={{ height: '95.896px', left: '8.96px', top: '748.96px', width: '258.502px' }}
        data-node-id="7383:106479"
      >
        <div className="absolute left-[18.76px] top-[19.8px] flex w-[183.453px] flex-col items-start gap-[5.212px] not-italic text-white" data-node-id="7383:106480">
          <p className="relative min-w-full shrink-0 font-['IBM_Plex_Sans',sans-serif] text-[0px] leading-[0]" data-node-id="7383:106481" style={{ fontFeatureSettings: "'zero' 1" }}>
            <span className="text-[14px] leading-normal text-[#6b8bae]" style={{ fontFeatureSettings: "'zero' 1" }}>
              PR - LTV Direction
            </span>
          </p>
          <p
            className="relative w-[214.723px] shrink-0 font-['IBM_Plex_Sans',sans-serif] text-[24px] font-bold leading-normal transition-all duration-300"
            data-node-id="7383:106482"
            style={{ fontFeatureSettings: "'zero' 1" }}
          >
            {snap.cardinalLabel}
          </p>
        </div>
      </div>

      <div
        className="absolute overflow-clip rounded-[8.339px] border-[1.042px] border-solid border-[var(--royal-blue,#191f3c)] bg-gradient-to-b from-[var(--royal-blue,#191f3c)] via-[rgba(82,109,130,0.1)] to-[rgba(26,61,100,0.7)]"
        style={{ height: '95.896px', left: '276.84px', top: '748.96px', width: '183.453px' }}
        data-node-id="7383:106483"
      >
        <div className="absolute left-[18.76px] top-[19.8px] flex w-[121.954px] flex-col items-start gap-[5.212px] leading-normal not-italic" data-node-id="7383:106484">
          <p className="relative min-w-full shrink-0 font-['IBM_Plex_Sans',sans-serif] text-[14px] text-[color:var(--moon-dust,#6b8bae)]" data-node-id="7383:106485" style={{ fontFeatureSettings: "'zero' 1" }}>
            Bearing to Rover
          </p>
          <p
            className="relative w-[80px] shrink-0 font-['IBM_Plex_Sans',sans-serif] text-[24px] font-bold text-white tabular-nums transition-all duration-300"
            data-node-id="7383:106486"
            style={{ fontFeatureSettings: "'zero' 1" }}
          >
            {Math.round(snap.bearingDeg)}°
          </p>
        </div>
      </div>

      <div
        className="absolute overflow-clip rounded-[8.339px] border-[1.042px] border-solid border-[var(--royal-blue,#191f3c)] bg-gradient-to-b from-[var(--royal-blue,#191f3c)] via-[rgba(82,109,130,0.1)] to-[rgba(26,61,100,0.7)]"
        style={{ height: '95.896px', left: '468.63px', top: '748.96px', width: '334.593px' }}
        data-node-id="7383:106487"
      >
        <div className="absolute left-[27.1px] top-[19.8px] flex w-[300px] flex-col items-start gap-[5.212px] leading-normal not-italic" data-node-id="7383:106488">
          <p className="relative min-w-full shrink-0 font-['IBM_Plex_Sans',sans-serif] text-[14px] text-[#6b8bae]" data-node-id="7383:106489" style={{ fontFeatureSettings: "'zero' 1" }}>
            LTV Coordinates
          </p>
          <p
            className="relative shrink-0 font-['IBM_Plex_Sans',sans-serif] text-[24px] font-bold text-white transition-all duration-300"
            data-node-id="7383:106490"
            style={{ fontFeatureSettings: "'zero' 1" }}
          >
            {snap.formattedCoords}
          </p>
        </div>
      </div>

      <div
        className="absolute overflow-clip rounded-[18.762px] border-[1.564px] border-solid border-[var(--royal-blue,#191f3c)]"
        style={{ height: '554px', left: '29.96px', top: '155.96px', width: '447px' }}
        data-node-id="7383:106491"
      >
        <img alt="" className="pointer-events-none absolute inset-0 size-full max-w-none rounded-[18.762px] object-cover" src={imgFrame427319083} />
        <div
          className="absolute h-[71.89px] w-[78.594px] transition-transform duration-1000 ease-out"
          style={{ left: `${132.52 + snap.feedRover1X}px`, top: `${245.78 + snap.feedRover1Y}px` }}
          data-node-id="7383:106492"
        >
          <img alt="" className="pointer-events-none absolute inset-0 size-full max-w-none object-cover" src={imgMarsRoverBlackAndWhiteClipart1} />
        </div>
        <div
          className="absolute flex h-[583.713px] w-[756.743px] items-center justify-center transition-transform duration-[2s] ease-in-out"
          style={{ left: `${-21.37 + snap.feedMapNudge * 8}px`, top: `${-10.95 + snap.feedMapNudge * 5}px` }}
        >
          <div className="flex-none rotate-180 scale-y-[-1]">
            <div className="relative h-[583.713px] w-[756.743px]" data-node-id="7383:106493">
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <img
                  alt=""
                  className="absolute left-[-3.7%] top-[0.44%] h-[99.61%] max-w-none transition-opacity duration-700"
                  style={{ width: '101.57%', opacity: 0.88 + 0.12 * Math.sin(snap.locateElapsedSeconds * 0.09) }}
                  src={imgImage105}
                />
              </div>
            </div>
          </div>
        </div>
        <div
          className="absolute h-[138.695px] w-[154.105px] transition-transform duration-1000 ease-out"
          style={{ left: `${39.09 + snap.feedRover2X}px`, top: `${281.95 + snap.feedRover2Y}px` }}
          data-node-id="7383:106494"
        >
          <img alt="" className="pointer-events-none absolute inset-0 size-full max-w-none object-cover" src={imgMarsRoverBlackAndWhiteClipart1} />
        </div>
        <div
          className="absolute flex items-center justify-center overflow-clip rounded-[18.493px] bg-[rgba(0,0,0,0.5)] px-[20.804px] py-[11.558px]"
          style={{ left: '8.44px', top: '494.44px' }}
          data-node-id="7383:106495"
        >
          <p className="relative shrink-0 whitespace-nowrap font-['IBM_Plex_Sans',sans-serif] text-[0px] not-italic leading-[0] text-white" data-node-id="7383:106496" style={{ fontFeatureSettings: "'zero' 1" }}>
            <span className="text-[14px] leading-normal">Environmental Risk Index: </span>
            <span className="text-[14px] leading-normal transition-colors duration-300" style={{ color: riskColor }}>
              {snap.envRiskIndex.toFixed(2)} ({snap.riskLabel}){' '}
            </span>
          </p>
        </div>
        <div className="absolute left-[19.25px] top-[16.93px] flex items-center" data-node-id="7383:106498">
          <div
            className="relative shrink-0 border border-solid border-[rgba(255,255,255,0.65)] px-[10.423px] py-[3.44px]"
            style={{ borderWidth: '1.032px' }}
            data-node-id="7383:106499"
          >
            <p className="whitespace-nowrap font-['IBM_Plex_Sans',sans-serif] text-[20px] font-normal not-italic leading-normal text-white" data-node-id="7383:106500" style={{ fontFeatureSettings: "'zero' 1" }}>
              EV Feed
            </p>
          </div>
        </div>
      </div>

      <div
        className="absolute overflow-clip rounded-[8px] border border-solid border-[var(--royal-blue,#191f3c)] bg-gradient-to-b from-[var(--royal-blue,#191f3c)] via-[rgba(82,109,130,0.1)] to-[rgba(26,61,100,0.7)]"
        style={{ height: '78px', left: '10.96px', top: '855.96px', width: '792px' }}
        data-node-id="7383:106501"
      >
        <div className="absolute left-[17px] top-[10px] flex w-[176px] flex-col items-start" data-node-id="7383:106502">
          <p className="relative w-full shrink-0 font-['IBM_Plex_Sans',sans-serif] text-[14px] font-normal not-italic leading-normal text-[color:var(--moon-dust,#6b8bae)]" data-node-id="7383:106503" style={{ fontFeatureSettings: "'zero' 1" }}>
            Distance to Beacon
          </p>
        </div>
        <p
          className="absolute left-[728px] top-[28px] w-[206px] -translate-x-full text-right font-['IBM_Plex_Sans',sans-serif] text-[0px] font-bold not-italic leading-[0] text-white"
          data-node-id="7383:106504"
          style={{ fontFeatureSettings: "'zero' 1" }}
        >
          <span className="text-[24px] leading-normal tabular-nums">{snap.bottomDistanceM} m </span>
          <span className="text-[24px] leading-normal text-[#4662a3]">/ {snap.bottomGoalM} m</span>
        </p>
        <div className="absolute left-[17px] top-[42px] h-[11px] w-[525px] overflow-hidden rounded-full bg-[#1a2535]" data-node-id="7383:106505">
          <div
            className="h-full rounded-full bg-[#00b288] transition-[width] duration-700 ease-out"
            style={{ width: `${bottomPct}%` }}
          />
        </div>
      </div>

      <div
        className="absolute flex flex-col overflow-hidden rounded-[8px] border border-solid border-[var(--royal-blue,#191f3c)] bg-[var(--midnight-blue,#060f1c)] px-4 pb-3 pt-2.5"
        style={{ height: '167px', left: '9.96px', top: '948.96px', width: '793px' }}
        data-node-id="7383:106507"
      >
        <div className="mb-2 flex shrink-0 items-baseline justify-between gap-4" data-node-id="7383:106508">
          <p
            className="min-w-0 shrink font-['IBM_Plex_Sans',sans-serif] text-[14px] font-normal not-italic leading-tight text-[color:var(--moon-dust,#6b8bae)]"
            data-node-id="7383:106509"
            style={{ fontFeatureSettings: "'zero' 1" }}
          >
            Signal Strength
          </p>
          <p
            className="shrink-0 whitespace-nowrap text-right font-['Inter',sans-serif] text-[11px] font-normal not-italic leading-tight text-white/90"
            data-node-id="7383:106521"
          >
            Transmission Latency:{' '}
            <span className="tabular-nums text-white">{snap.latencySec.toFixed(2)} s</span>
          </p>
        </div>

        {/* Figma `7383:106512` — chart: bars + playhead + threshold; readout in fixed right gutter (no overlap) */}
        <div
          className="relative min-h-0 flex-1 overflow-hidden rounded-t-[17px] bg-[rgba(0,0,0,0.12)]"
          data-node-id="7383:106512"
        >
          {/* Bar plot — right inset reserves gutter for readout (Figma label column) */}
          <div
            className="absolute inset-y-2 left-2 right-[132px] flex items-end justify-start gap-[2px]"
            aria-hidden
          >
            {snap.signalBars.map((h, i) => {
              const norm = Math.max(0.08, Math.min(1, h))
              const hot = norm >= snap.signalPct / 100 - 0.1
              const barH = Math.round(22 + norm * 68)
              return (
                <div
                  key={i}
                  className={`min-w-0 max-w-[12px] flex-1 rounded-t-[1px] transition-[height,background-color] duration-500 ease-out ${hot ? 'bg-[#00b288]' : 'bg-[#2a3d52]'}`}
                  style={{ height: `${barH}px`, maxHeight: '100%' }}
                />
              )
            })}
          </div>

          {/* Horizontal reference — strength “floor” / visual anchor (Figma `106520`) */}
          <div
            className="pointer-events-none absolute left-2 right-[132px] top-[58%] z-[1] h-px bg-[#00b288]/80 transition-opacity duration-500"
            data-node-id="7383:106520"
          />

          {/* Vertical playhead — X = signal % of plot width only (same box as bars) */}
          <div
            className="pointer-events-none absolute bottom-2 top-2 z-[2] w-0 border-l border-white/75 shadow-[0_0_6px_rgba(255,255,255,0.25)] transition-[left] duration-700 ease-out"
            style={{
              left: `calc(0.5rem + (100% - 1rem - 132px) * ${snap.signalPct / 100})`,
            }}
            data-node-id="7383:106519"
          />

          {/* Readout — right column, vertically centered on chart */}
          <div
            className="pointer-events-none absolute bottom-2 right-2 top-2 z-[3] flex w-[120px] flex-col justify-center border-l border-[rgba(107,138,174,0.35)] pl-3 text-right"
            data-node-id="7383:106518"
          >
            <p className="font-['IBM_Plex_Sans',sans-serif] text-[14px] font-medium not-italic leading-snug text-[#00b288]" style={{ fontFeatureSettings: "'zero' 1" }}>
              <span className="tabular-nums">{snap.signalPct}%</span>
            </p>
            <p className="mt-0.5 font-['IBM_Plex_Sans',sans-serif] text-[12px] font-normal not-italic leading-snug text-[#6b8bae]" style={{ fontFeatureSettings: "'zero' 1" }}>
              <span className="tabular-nums">({snap.signalDbm} dBm)</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
