import { useEffect, useState } from 'react'
import { iteration4Ls } from '../assets/figmaAssets'
import { getSuitsDerived, suitsTelemetryMock } from '../mock/suitsTelemetryMock'
import EvPanelBiometricsBlock from './EvPanelBiometricsBlock'
import HudGridOverlay from './HudGridOverlay'
import Iteration4LsEmbed, {
  ITERATION4_LS_NODE_IDS_SUITS1,
  ITERATION4_LS_NODE_IDS_SUITS2,
  SegmentedStrip,
  SEGMENT_COUNT,
} from './Iteration4LsEmbed'

function TankProgressCard({ label, sublabel, pct, bordered }) {
  return (
    <div
      className={`rounded-md bg-gradient-to-b from-[rgba(26,61,100,0.3)] via-[rgba(6,15,28,0.3)] to-[rgba(26,61,100,0.3)] px-2 py-2.5 ${
        bordered ? 'border border-[#6b8bae]' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-[88px] shrink-0 text-center text-[14px] leading-tight text-white">
          {label}
          {sublabel ? (
            <>
              <br />
              {sublabel}
            </>
          ) : null}
        </div>
        <div className="min-w-0 flex-1 overflow-hidden rounded-full bg-[#0a0f16] h-2">
          <div
            className="h-full rounded-full bg-[#00b288] transition-[width] duration-500 ease-out"
            style={{ width: `${clampPct(pct)}%` }}
          />
        </div>
        <span className="w-[52px] shrink-0 text-right text-[20px] leading-none text-white tabular-nums">
          {Math.round(pct)}
          <span className="text-[#b9d3cd]">%</span>
        </span>
      </div>
    </div>
  )
}

function clampPct(p) {
  return Math.min(100, Math.max(0, p))
}

function FlowRing({ fraction, size = 108 }) {
  const r = 36
  const c = 2 * Math.PI * r
  const off = c * (1 - clampPct(fraction) / 100)
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="shrink-0" aria-hidden>
      <circle cx="50" cy="50" r={r} fill="none" stroke="#1a2535" strokeWidth="9" />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke="#00b288"
        strokeWidth="9"
        strokeDasharray={`${c} ${c}`}
        strokeDashoffset={off}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
        className="transition-[stroke-dashoffset] duration-500"
      />
    </svg>
  )
}

function DualTempChart({ inletSeries, returnSeries }) {
  const w = 220
  const h = 118
  const padX = 14
  const padY = 10
  const all = [...inletSeries, ...returnSeries]
  const minT = Math.min(...all, 45) - 2
  const maxT = Math.max(...all, 90) + 2
  const toX = (i, len) => padX + (i / Math.max(len - 1, 1)) * (w - 2 * padX)
  const toY = (t) => padY + (1 - (t - minT) / (maxT - minT)) * (h - 2 * padY)
  const dLine = (arr) =>
    arr.map((t, i) => `${i === 0 ? 'M' : 'L'} ${toX(i, arr.length).toFixed(1)} ${toY(t).toFixed(1)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-[118px] w-full" role="img" aria-label="LCVG inlet and return temperature trend">
      <path d={dLine(inletSeries)} fill="none" stroke="#00b288" strokeWidth="1.6" strokeLinejoin="round" />
      <path d={dLine(returnSeries)} fill="none" stroke="#6b8bae" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  )
}

function formatRemaining(minutes) {
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return { h, m }
}

/**
 * @param {object} props
 * @param {boolean} [props.embed]
 * @param {string} [props.className]
 * @param {'suits1' | 'suits2'} [props.embedVariant] Figma `7383:106270` vs `7383:106095` — same widgets, different node ids / labels
 * @param {string} [props.suitsTitle] Suits badge label (defaults from variant)
 * @param {string} [props.evCrewLabel] EV row label for `EvPanelBiometricsBlock` (defaults from variant)
 * @param {string} [props.crewIdText] Optional crew id caption (`7383:106108`); shown for `suits2` by default
 * @param {'suits1' | 'suits2'} [props.telemetrySlot] Mock stream for embed / dev panels (defaults from `embedVariant`; non-embed uses `suits1`)
 */
export default function SuitsPanel({
  embed = false,
  className = '',
  embedVariant = 'suits1',
  suitsTitle: suitsTitleProp,
  evCrewLabel: evCrewLabelProp,
  crewIdText: crewIdTextProp,
  telemetrySlot: telemetrySlotProp,
}) {
  const [snap, setSnap] = useState(() => suitsTelemetryMock.getSnapshot())

  useEffect(() => suitsTelemetryMock.subscribe(setSnap), [])

  const telemetrySlot = telemetrySlotProp ?? (embed ? (embedVariant === 'suits2' ? 'suits2' : 'suits1') : 'suits1')
  const slotSnap = snap[telemetrySlot]
  const { suits: s } = slotSnap
  const { o2Segments, co2Segments, lcvgFlowNorm } = getSuitsDerived(slotSnap)
  const clock = new Date().toLocaleTimeString('en-GB', { hour12: false })
  const rem = formatRemaining(s.o2RemainingMinutes)

  const shell = embed
    ? `relative text-[14px] ${className}`
    : `relative max-w-md overflow-hidden rounded-2xl bg-[#1b1e26] p-4 ring-2 ring-[#1f8f6b] ${className}`

  const embedNodeIds = embedVariant === 'suits2' ? ITERATION4_LS_NODE_IDS_SUITS2 : ITERATION4_LS_NODE_IDS_SUITS1
  const embedRootNodeId = embedVariant === 'suits2' ? '7383:106095' : '7383:106270'
  const suitsTitle = suitsTitleProp ?? (embedVariant === 'suits2' ? 'Suits 2' : 'Suits 1')
  const evCrewLabel = evCrewLabelProp ?? (embedVariant === 'suits2' ? 'EV 2' : 'EV 1')
  const crewIdText = crewIdTextProp ?? (embedVariant === 'suits2' ? 'Crew ID 1231231243' : undefined)

  if (embed) {
    return (
      <section className={shell} data-node-id={embedRootNodeId} data-name="Iteration 4 LS">
        <div className="flex h-full min-h-0 flex-col overflow-y-auto pb-6 font-['IBM_Plex_Sans',sans-serif]">
          <Iteration4LsEmbed nodeIds={embedNodeIds} suitsTitle={suitsTitle} telemetrySlot={telemetrySlot} />

          <EvPanelBiometricsBlock
            layout="suitsColumn"
            evLabel={evCrewLabel}
            crewIdText={crewIdText}
            telemetrySlot={telemetrySlot}
          />

          <div className="mt-auto flex shrink-0 justify-center px-6 pt-4 opacity-80" data-node-id={embedNodeIds.bottomHairline}>
            <div className="h-0 w-full max-w-[453px]">
              <div className="relative -top-px">
                <img alt="" className="block w-full max-w-none" src={iteration4Ls.bottomHairline} />
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className={shell}>
      {!embed && <HudGridOverlay />}

      <div className="relative z-[1]">
        <div className="mb-3 flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-[#0f1113] opacity-80" aria-hidden />
          <div className="rounded-xl border border-[#b9d3cd] px-4 py-1 opacity-90">
            <span className="text-lg font-medium text-[#b9d3cd]">Suits</span>
          </div>
        </div>

        <div className="mb-2 rounded-sm border border-black bg-[#191f3c] px-2 py-2">
          <div className="flex flex-wrap items-center gap-4 text-white">
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#00b288] shadow-[0_0_6px_#00b288]" />
            </span>
            <span>{s.missionId}</span>
            <span className="text-[#00b288]">{s.subsystem}</span>
            <span className="tabular-nums">{clock}</span>
          </div>
        </div>

        <div
          className={`mb-3 flex items-center justify-center rounded-[5px] border px-5 py-2 text-center text-[14px] font-['IBM_Plex_Sans',sans-serif] font-normal leading-normal not-italic ${
            s.systemsNominal
              ? 'border-[#00b288] bg-[rgba(0,178,136,0.07)] text-[#00b288]'
              : 'border-[#ffa600] bg-[rgba(255,166,0,0.07)] text-[#ffa600]'
          }`}
        >
          <span className="whitespace-nowrap" style={{ fontFeatureSettings: "'zero' 1" }}>
            {s.systemsBanner}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <div className="min-h-[200px] rounded-[10px] border-2 border-[#060f1c] bg-gradient-to-b from-[rgba(26,61,100,0.3)] via-[rgba(6,15,28,0.3)] to-[rgba(26,61,100,0.3)] p-3">
            <div className="mb-4 flex items-start justify-between gap-2">
              <div className="flex shrink-0 items-baseline gap-1 text-white">
                <span className="text-2xl font-bold">O</span>
                <span className="align-super text-sm font-normal">2</span>
              </div>
              <SegmentedStrip active={o2Segments} count={SEGMENT_COUNT} />
              <div className="flex shrink-0 items-baseline gap-1">
                <span className="text-3xl font-medium text-white tabular-nums">{s.o2Psi.toFixed(1)}</span>
                <span className="text-[15px] text-[#b9d3cd]">psi</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <TankProgressCard label="Tank" sublabel="1" pct={s.o2Tank1Pct} bordered />
              <TankProgressCard label="Tank" sublabel="2" pct={s.o2Tank2Pct} bordered={false} />
            </div>
            <div className="mt-3 flex justify-end gap-2 text-[14px]">
              <span className="text-[#6b8bae]">Total Remaining Time:</span>
              <span className="text-white">
                {rem.h}
                <span className="text-[#b9d3cd]">hr</span> {rem.m}
                <span className="text-[#b9d3cd]">min</span>
              </span>
            </div>
          </div>

          <div className="rounded-[10px] border-2 border-[#060f1c] bg-gradient-to-b from-[rgba(26,61,100,0.3)] via-[rgba(6,15,28,0.3)] to-[rgba(26,61,100,0.3)] p-3">
            <div className="mb-4 flex items-start justify-between gap-2">
              <div className="flex shrink-0 items-baseline gap-1 text-white">
                <span className="text-2xl font-bold">CO</span>
                <span className="align-super text-sm font-normal">2</span>
              </div>
              <SegmentedStrip active={co2Segments} count={SEGMENT_COUNT} />
              <div className="flex shrink-0 items-baseline gap-1">
                <span className="text-3xl font-medium text-white tabular-nums">{s.co2MmHg.toFixed(1)}</span>
                <span className="text-[15px] text-[#b9d3cd]">mmHg</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <TankProgressCard label="Scrubber Efficiency" pct={s.scrubberEfficiencyPct} bordered />
              <TankProgressCard label="Tank" sublabel="2" pct={s.co2Tank2Pct} bordered={false} />
            </div>
          </div>

          <div className="rounded-[10px] border-2 border-[#191f3c] bg-gradient-to-b from-[rgba(26,61,100,0.3)] via-[rgba(6,15,28,0.3)] to-[rgba(26,61,100,0.3)] p-2">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="w-full shrink-0 rounded-xl bg-gradient-to-b from-[rgba(26,61,100,0.3)] via-[rgba(6,15,28,0.3)] to-[rgba(26,61,100,0.3)] p-3 sm:w-[178px]">
                <div className="mb-2 text-[14px] text-white">LCVG Flow Rate</div>
                <div className="flex items-center justify-center gap-2">
                  <FlowRing fraction={lcvgFlowNorm * 100} />
                  <div className="text-center">
                    <div className="text-3xl font-medium text-white tabular-nums">{Math.round(s.lcvgFlowLbHr)}</div>
                    <div className="text-sm text-[#526d82]">lb/hr</div>
                  </div>
                </div>
                <div className="mt-3 rounded-xl bg-gradient-to-b from-[rgba(26,61,100,0.3)] via-[rgba(6,15,28,0.3)] to-[rgba(26,61,100,0.3)] p-2 text-[13px]">
                  <div className="mb-1 flex justify-between gap-1 border-b border-[#4662a3]/70 pb-1">
                    <span className="text-white">FW-Pressure</span>
                    <span className="text-white tabular-nums">{s.fwPressurePsi.toFixed(1)}</span>
                    <span className="text-[#b9d3cd]">psi</span>
                  </div>
                  <div className="flex justify-between gap-1">
                    <span className="text-white">FW-Quantity</span>
                    <span className="text-white tabular-nums">{Math.round(s.fwQuantityPct)}</span>
                    <span className="text-[#b9d3cd]">%</span>
                  </div>
                </div>
              </div>

              <div className="min-w-0 flex-1 rounded-xl bg-gradient-to-b from-[rgba(26,61,100,0.3)] via-[rgba(6,15,28,0.3)] to-[rgba(26,61,100,0.3)] p-2">
                <div className="relative rounded-lg bg-[#060f1c] px-2 pb-0 pt-1">
                  <div className="absolute left-1 top-6 origin-left -rotate-90 whitespace-nowrap text-[10px] text-[#b9d3cd]">TEMP (°F)</div>
                  <DualTempChart inletSeries={s.tempSeriesInlet} returnSeries={s.tempSeriesReturn} />
                  <div className="-mt-1 pr-1 text-right text-[10px] text-[#b9d3cd]">HH:MM:SS</div>
                </div>
                <div className="mt-2 space-y-1 px-1 text-[14px]">
                  <div className="flex justify-between border-b border-[#526d82] pb-1">
                    <span className="text-white">LCVG Inlet</span>
                    <span className="text-white tabular-nums">{s.lcvgInletF.toFixed(0)} °F</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white">LCVG Return</span>
                    <span className="text-white tabular-nums">{s.lcvgReturnF.toFixed(0)} °F</span>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-end gap-2 pr-1 text-[14px]">
                  <span className="text-[#6b8bae]">ΔT:</span>
                  <span className="text-white tabular-nums">{s.deltaTCurrent}</span>
                  <span className="text-[#b9d3cd]">°F</span>
                  <span className="text-white">/</span>
                  <span className="tabular-nums text-[#4662a3]">{s.deltaTMax}</span>
                  <span className="text-[#b9d3cd]">°F</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
