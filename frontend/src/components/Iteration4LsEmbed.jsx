import { useEffect, useState } from 'react'
import { iteration4Ls } from '../assets/figmaAssets'
import { getSuitsDerived, suitsTelemetryMock } from '../mock/suitsTelemetryMock'
import FanRpmTelemetryCard from './FanRpmTelemetryCard'
import LcvgFlowRateGauge from './LcvgFlowRateGauge'

export const SEGMENT_COUNT = 15

/** @typedef {{ headerRow: string, suitsBadge: string, systemsBanner: string, systemsBannerText: string, metricsStack: string, bottomHairline: string }} Iteration4LsEmbedNodeIds */

/** Figma `7383:106270` — Suits 1 column */
export const ITERATION4_LS_NODE_IDS_SUITS1 = {
  headerRow: '7383:106276',
  suitsBadge: '7383:106277',
  systemsBanner: '7383:106274',
  systemsBannerText: '7383:106275',
  metricsStack: '7383:106283',
  bottomHairline: '7383:106272',
}

/** Figma `7383:106095` — Suits 2 column (same widgets, design-system node ids) */
export const ITERATION4_LS_NODE_IDS_SUITS2 = {
  headerRow: '7383:106101',
  suitsBadge: '7383:106102',
  systemsBanner: '7383:106099',
  systemsBannerText: '7383:106100',
  metricsStack: '7383:106110',
  bottomHairline: '7383:106097',
}

export function SegmentedStrip({
  active,
  activeClass = 'bg-[#00b288]',
  idleClass = 'bg-[#1a2535]',
  compact = false,
  count = SEGMENT_COUNT,
}) {
  const barClass = compact
    ? 'w-[11px] rounded-[2px] h-5 transition-colors duration-300'
    : 'w-[7px] rounded-[2px] h-5 transition-colors duration-300'
  const gapClass = 'gap-[3px]'
  const wrapClass = compact ? `flex ${gapClass} h-7 w-[210px] shrink-0 items-end justify-start` : `flex ${gapClass} items-end h-7 shrink-0`
  return (
    <div className={wrapClass}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={`${barClass} ${i < active ? activeClass : idleClass}`} />
      ))}
    </div>
  )
}

function Iteration4MetricPill({ label, pct, wideLabel }) {
  return (
    <div className="relative h-[38px] w-[214px] shrink-0 overflow-hidden rounded-[6px] border border-[#6b8bae] bg-gradient-to-b from-[rgba(26,61,100,0.3)] via-[52.404%] via-[rgba(6,15,28,0.3)] to-[93.75%] to-[rgba(26,61,100,0.3)]">
      <div className="absolute left-3 top-2 flex w-[189px] items-center justify-between font-['IBM_Plex_Sans',sans-serif] not-italic leading-none">
        <span
          className={`text-[14px] text-white ${wideLabel ? 'w-[118px] text-left' : 'w-[58px] text-center'}`}
          style={{ fontFeatureSettings: "'zero' 1" }}
        >
          {label}
        </span>
        <div className="flex items-center gap-2 text-right text-[20px]">
          <span className="tabular-nums text-white" style={{ fontFeatureSettings: "'zero' 1" }}>
            {Math.round(pct)}
          </span>
          <span className="w-[14px] text-[#b9d3cd]" style={{ fontFeatureSettings: "'zero' 1" }}>
            %
          </span>
        </div>
      </div>
    </div>
  )
}

function Iteration4O2Block({ o2Psi, segments, tank1Pct, tank2Pct }) {
  return (
    <div className="relative h-[134px] w-full shrink-0 overflow-hidden rounded-[10px] border-2 border-[#060f1c] bg-gradient-to-b from-[rgba(26,61,100,0.3)] via-[52.404%] via-[rgba(6,15,28,0.3)] to-[93.75%] to-[rgba(26,61,100,0.3)]">
      <div className="absolute left-[13px] top-[19px] flex w-[432px] max-w-[calc(100%-26px)] flex-col items-end gap-[26px]">
        <div className="relative h-7 w-full min-w-0 max-w-[397px]">
          <div className="absolute left-0 top-0 h-7 w-full max-w-[384px]">
            <div className="-translate-y-1/2 absolute left-[-2px] top-[13px] flex h-[22px] flex-col justify-center">
              <p className="whitespace-pre-wrap" style={{ fontFeatureSettings: "'zero' 1" }}>
                <span className="font-['IBM_Plex_Sans',sans-serif] text-[24px] font-bold leading-none text-white">O</span>
                <span className="font-['IBM_Plex_Sans',sans-serif] text-[14px] font-normal leading-none text-white">2</span>
                <span className="font-['IBM_Plex_Sans',sans-serif] text-[24px] font-bold text-white"> </span>
              </p>
            </div>
            <div className="absolute left-[68px] top-0 flex h-7 w-[210px] items-end" data-node-id="7383:106290">
              <SegmentedStrip active={segments} compact count={SEGMENT_COUNT} />
            </div>
            <div className="absolute right-0 top-0.5 flex items-center gap-0.5 text-right">
              <span
                className="flex h-[25px] w-[60px] flex-col justify-center font-['IBM_Plex_Sans',sans-serif] text-[32px] font-medium leading-none text-white"
                style={{ fontFeatureSettings: "'zero' 1" }}
              >
                {o2Psi.toFixed(1)}
              </span>
              <span className="flex h-[25px] w-[47px] flex-col justify-end font-['Inter',sans-serif] text-[15px] font-normal leading-none text-[#b9d3cd]">
                psi
              </span>
            </div>
          </div>
        </div>
        <div className="flex w-full max-w-[432px] items-center justify-between">
          <Iteration4MetricPill label="Tank 1" pct={tank1Pct} />
          <Iteration4MetricPill label="Tank 2" pct={tank2Pct} />
        </div>
      </div>
    </div>
  )
}

function Iteration4Co2Block({ co2MmHg, segments, scrubAPct, scrubBPct }) {
  return (
    <div className="relative h-[134px] w-full shrink-0 overflow-hidden rounded-[10px] border-2 border-[#060f1c] bg-gradient-to-b from-[rgba(26,61,100,0.3)] via-[52.404%] via-[rgba(6,15,28,0.3)] to-[93.75%] to-[rgba(26,61,100,0.3)]">
      <div className="absolute left-[13px] top-[19px] flex w-[432px] max-w-[calc(100%-26px)] flex-col items-end gap-[26px]">
        <div className="relative h-7 w-full min-w-0 max-w-[397px]">
          <div className="absolute left-0 top-0 h-7 w-full max-w-[384px]">
            <div className="-translate-y-1/2 absolute left-[-2px] top-[13px] flex h-[22px] flex-col justify-center">
              <p className="whitespace-pre-wrap" style={{ fontFeatureSettings: "'zero' 1" }}>
                <span className="font-['IBM_Plex_Sans',sans-serif] text-[24px] font-bold leading-none text-white">CO</span>
                <span className="font-['IBM_Plex_Sans',sans-serif] text-[14px] font-normal leading-none text-white">2</span>
                <span className="font-['IBM_Plex_Sans',sans-serif] text-[24px] font-bold text-white"> </span>
              </p>
            </div>
            <div className="absolute left-[68px] top-0 flex h-7 w-[210px] items-end" data-node-id="7383:106331">
              <SegmentedStrip active={segments} compact count={SEGMENT_COUNT} />
            </div>
            <div className="absolute right-0 top-0.5 flex items-center gap-0.5 text-right">
              <span
                className="flex h-[25px] w-[60px] flex-col justify-center font-['IBM_Plex_Sans',sans-serif] text-[32px] font-medium leading-none text-white"
                style={{ fontFeatureSettings: "'zero' 1" }}
              >
                {co2MmHg.toFixed(1)}
              </span>
              <span className="flex h-[25px] w-[47px] flex-col justify-end font-['Inter',sans-serif] text-[15px] font-normal leading-none text-[#b9d3cd]">
                mmHg
              </span>
            </div>
          </div>
        </div>
        <div className="flex w-full max-w-[432px] items-center justify-between">
          <Iteration4MetricPill label="Scrubber A" pct={scrubAPct} wideLabel />
          <Iteration4MetricPill label="Scrubber B" pct={scrubBPct} wideLabel />
        </div>
      </div>
    </div>
  )
}

function Iteration4LcvgFansBlock({ flowLbHr, flowMax, flowNorm, fanPriRpm, fanSecRpm }) {
  return (
    <div
      className="relative min-h-[173px] w-full shrink-0 overflow-hidden rounded-[10px] border-2 border-[#191f3c] bg-gradient-to-b from-[rgba(26,61,100,0.3)] via-[52.404%] via-[rgba(6,15,28,0.3)] to-[93.75%] to-[rgba(26,61,100,0.3)] p-2"
      data-node-id="7383:106367"
    >
      <div className="flex flex-wrap items-start justify-center gap-2 sm:flex-nowrap">
        <LcvgFlowRateGauge flowLbHr={flowLbHr} flowMax={flowMax} flowNorm={flowNorm} />
        <FanRpmTelemetryCard fanPriRpm={fanPriRpm} fanSecRpm={fanSecRpm} />
      </div>
    </div>
  )
}

/**
 * Shared Iteration 4 LS column body (Figma `7383:106270` / `7383:106095`) — Suits badge, systems banner, O₂ / CO₂ / LCVG+FAN.
 * @param {{ nodeIds: Iteration4LsEmbedNodeIds, suitsTitle: string, telemetrySlot?: 'suits1' | 'suits2' }} props
 */
export default function Iteration4LsEmbed({ nodeIds, suitsTitle, telemetrySlot = 'suits1' }) {
  const [full, setFull] = useState(() => suitsTelemetryMock.getSnapshot())
  useEffect(() => suitsTelemetryMock.subscribe(setFull), [])

  const snap = full[telemetrySlot]
  const { suits: s } = snap
  const { o2Segments, co2Segments, lcvgFlowNorm } = getSuitsDerived(snap)

  return (
    <>
      <div className="flex shrink-0 pl-5 pt-3.5" data-node-id={nodeIds.headerRow}>
        <div
          className="flex h-[46px] w-[137px] shrink-0 items-center justify-center gap-2 overflow-hidden rounded-[12px] border border-[#6b8bae] bg-[rgba(6,15,28,0.35)] px-4 py-2.5 backdrop-blur-[50px]"
          data-node-id={nodeIds.suitsBadge}
        >
          <div className="relative h-[25px] w-[26px] shrink-0">
            <img alt="" className="absolute inset-0 block size-full max-w-none" src={iteration4Ls.suitsIcon} />
          </div>
          <span className="text-center text-[20px] font-medium leading-none text-[#b9d3cd]">{suitsTitle}</span>
        </div>
      </div>

      <div
        className={`mx-3 mt-2.5 flex h-[31px] shrink-0 items-center justify-center rounded-[5px] border border-solid px-5 py-2 text-center text-[14px] ${
          s.systemsNominal
            ? 'border-[#00b288] bg-[rgba(0,178,136,0.07)] text-[#00b288]'
            : 'border-[#ffa600] bg-[rgba(255,166,0,0.07)] text-[#ffa600]'
        }`}
        data-node-id={nodeIds.systemsBanner}
      >
        <p
          className="whitespace-nowrap text-center font-['IBM_Plex_Sans',sans-serif] font-normal leading-normal not-italic"
          style={{ fontFeatureSettings: "'zero' 1" }}
          data-node-id={nodeIds.systemsBannerText}
        >
          {s.systemsBanner}
        </p>
      </div>

      <div className="mx-3 mt-3.5 flex max-w-[462px] flex-col gap-[7px]" data-node-id={nodeIds.metricsStack}>
        <Iteration4O2Block o2Psi={s.o2Psi} segments={o2Segments} tank1Pct={s.o2Tank1Pct} tank2Pct={s.o2Tank2Pct} />
        <Iteration4Co2Block
          co2MmHg={s.co2MmHg}
          segments={co2Segments}
          scrubAPct={s.scrubberEfficiencyPct}
          scrubBPct={s.co2Tank2Pct}
        />
        <Iteration4LcvgFansBlock
          flowLbHr={s.lcvgFlowLbHr}
          flowMax={s.lcvgFlowMaxLbHr}
          flowNorm={lcvgFlowNorm}
          fanPriRpm={s.fanPriRpm}
          fanSecRpm={s.fanSecRpm}
        />
      </div>
    </>
  )
}
