import { useEffect, useState } from 'react'
import commsPillChevronUrl from '../assets/icons/comms-pill-chevron.svg'
import SuitsPanel from './SuitsPanel'
import LtvBeaconPanel from './LtvBeaconPanel'
import CommsSearchMagnifyingGlassIcon from './icons/CommsSearchMagnifyingGlassIcon.jsx'

/** Proportional flex weight from label length (content-sized / “按字数分”空间). */
function commsPillFlexWeight(label, withChevron) {
  return Math.max(6, label.length + (withChevron ? 4 : 0))
}

const COMMS_PILL_LABEL = {
  pr: 'PR',
  ev: 'EV',
  ev1: 'EV1 crash near POI 2',
  ev2o2: 'EV2 low O₂ levels',
  ev2hr: 'EV2 high heart rate',
}

/** Figma mock `00:12:23` — seconds since midnight-style display as rolling MET (HH:MM:SS). */
const INITIAL_COMMS_HISTORY_ELAPSED_S = 12 * 60 + 23

function formatElapsedHhMmSs(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds))
  const hh = Math.floor(s / 3600)
  const mm = Math.floor((s % 3600) / 60)
  const ss = s % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}

/** Figma `7383:106538` — chevron from `assets/icons/comms-pill-chevron.svg` */
function CommsPillChevron() {
  return (
    <img
      src={commsPillChevronUrl}
      alt=""
      className="pointer-events-none h-[9px] w-[8px] shrink-0 object-contain opacity-90"
      data-name="comms-pill-chevron"
    />
  )
}

export default function CritOnMar29() {
  const [commsFilter, setCommsFilter] = useState('pr')
  const [commsHistoryElapsedS, setCommsHistoryElapsedS] = useState(INITIAL_COMMS_HISTORY_ELAPSED_S)

  useEffect(() => {
    const id = window.setInterval(() => {
      setCommsHistoryElapsedS((t) => t + 1)
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div
      className="relative mx-auto h-[1200px] w-[1892px] max-w-none overflow-clip bg-gradient-to-b from-[#3b5060] to-[var(--midnight-blue-\(correct\),#060f1c)]"
      data-node-id="7383:106092"
      data-name="Ver2  2 suits 2 EV"
    >
      <div className="absolute contents left-0 top-0" data-node-id="5758:27112">
        <div className="absolute border-3 border-[rgba(255,255,255,0)] border-solid left-0 top-0 h-[1200px] w-[1892px]" data-node-id="5758:27113" />
      </div>
      <div
        className="absolute left-[545px] top-[233px] h-[935px] w-[487px]"
        data-node-id="5758:27114"
        data-name="iteration 6 - (sandy edit) — Suits 2 / Figma 7383:106095"
      >
        <SuitsPanel
          embed
          embedVariant="suits2"
          telemetrySlot="suits2"
          className="h-full w-full overflow-clip rounded-[20px] bg-[var(--midnight-blue,#060f1c)]"
        />
      </div>
      <SuitsPanel
        embed
        className="absolute bg-[var(--midnight-blue,#060f1c)] h-[935px] left-[48px] overflow-clip rounded-[20px] top-[233px] w-[487px]"
      />
      <LtvBeaconPanel className="absolute h-[1117px] w-[817px] overflow-clip rounded-[16px] border-[1.042px] border-solid border-black bg-[var(--midnight-blue,#060f1c)] left-[1046px] top-[32px]" />
      <div className="absolute h-[194px] left-[43px] overflow-clip rounded-[12px] top-[32px] w-[989px]" data-node-id="5758:27433">
        <div
          className="absolute inset-0 rounded-[12px] bg-[var(--midnight-blue,#060f1c)]"
          data-node-id="5758:27434"
          aria-hidden
        />
        <div className="absolute h-[186px] left-[3px] overflow-clip top-px w-[966px]" data-node-id="5758:27435">
          <div className="absolute h-[36px] left-[23px] overflow-clip top-[11px] w-[959px]" data-node-id="5758:27436">
            {/* Figma `7383:106529` Rectangle 2450 — search field + icon */}
            <div
              className="absolute left-[185px] top-[9px] flex h-[21px] w-[175px] items-center gap-1 rounded-[7.5px] border border-solid border-[var(--moon-blue,#526d82)] bg-[rgba(6,15,28,0.45)] px-1.5"
              data-node-id="7383:106529"
            >
              <input
                type="search"
                name="comms-history-search"
                placeholder="Search…"
                aria-label="Search comms history"
                className="h-full min-w-0 flex-1 bg-transparent font-['IBM_Plex_Sans',sans-serif] text-[11px] text-white outline-none placeholder:text-[#526d82]"
                style={{ fontFeatureSettings: "'zero' 1" }}
                autoComplete="off"
              />
              <span className="pointer-events-none flex size-[14px] shrink-0 items-center justify-center" aria-hidden data-node-id="5758:27441">
                <CommsSearchMagnifyingGlassIcon className="block" />
              </span>
            </div>
            <div className="absolute bg-[var(--royal-blue,#191f3c)] h-[20px] left-[858px] rounded-[7.5px] top-[10px] w-[112px]" data-node-id="5758:27442" />
            <div
              className="absolute left-[369px] top-[3px] flex h-[34px] w-[584px] items-center pl-0.5 pr-1.5"
              data-node-id="5758:27443"
            >
              {/* Figma `7383:106532` — flex-grow ∝ 文案长度；最后一粒不截断 */}
              <div
                className="comms-filter-pill-row flex h-[20px] w-full min-w-0 max-w-full items-stretch gap-0.5 overflow-x-auto"
                role="tablist"
                aria-label="Filter comms history by role or event"
              >
                <button
                  type="button"
                  aria-pressed={commsFilter === 'pr'}
                  onClick={() => setCommsFilter('pr')}
                  className={`flex min-h-[20px] min-w-0 items-center justify-center gap-0.5 rounded-[7.5px] px-0.5 font-['IBM_Plex_Sans',sans-serif] text-[11px] font-medium leading-tight text-[color:var(--starlight,#b9d3cd)] transition-colors ${
                    commsFilter === 'pr' ? 'bg-[var(--moon-blue,#4662a3)] not-italic' : 'bg-[var(--royal-blue,#191f3c)] not-italic'
                  }`}
                  data-node-id="7383:106534"
                  style={{
                    flexGrow: commsPillFlexWeight(COMMS_PILL_LABEL.pr, true),
                    flexShrink: 1,
                    flexBasis: 0,
                    minWidth: 0,
                    fontFeatureSettings: "'zero' 1",
                  }}
                >
                  <span className="min-w-0 truncate">{COMMS_PILL_LABEL.pr}</span>
                  <span className="shrink-0">
                    <CommsPillChevron />
                  </span>
                </button>
                <button
                  type="button"
                  aria-pressed={commsFilter === 'ev'}
                  onClick={() => setCommsFilter('ev')}
                  className={`flex min-h-[20px] min-w-0 items-center justify-center gap-0.5 rounded-[7.5px] px-0.5 font-['IBM_Plex_Sans',sans-serif] text-[11px] font-medium leading-tight text-[color:var(--starlight,#b9d3cd)] transition-colors ${
                    commsFilter === 'ev' ? 'bg-[var(--moon-blue,#4662a3)] not-italic' : 'bg-[var(--royal-blue,#191f3c)] italic'
                  }`}
                  data-node-id="7383:106536"
                  style={{
                    flexGrow: commsPillFlexWeight(COMMS_PILL_LABEL.ev, true),
                    flexShrink: 1,
                    flexBasis: 0,
                    minWidth: 0,
                    fontFeatureSettings: "'zero' 1",
                  }}
                >
                  <span className="min-w-0 truncate">{COMMS_PILL_LABEL.ev}</span>
                  <span className="shrink-0">
                    <CommsPillChevron />
                  </span>
                </button>
                <button
                  type="button"
                  aria-pressed={commsFilter === 'ev1'}
                  onClick={() => setCommsFilter('ev1')}
                  title={COMMS_PILL_LABEL.ev1}
                  className={`flex min-h-[20px] min-w-0 items-center justify-center gap-0.5 rounded-[7.5px] px-0.5 font-['IBM_Plex_Sans',sans-serif] text-[11px] font-medium leading-tight text-[color:var(--starlight,#b9d3cd)] transition-colors ${
                    commsFilter === 'ev1' ? 'bg-[var(--moon-blue,#4662a3)] not-italic' : 'bg-[var(--royal-blue,#191f3c)] italic'
                  }`}
                  data-node-id="7383:106545"
                  style={{
                    flexGrow: commsPillFlexWeight(COMMS_PILL_LABEL.ev1, true),
                    flexShrink: 1,
                    flexBasis: 0,
                    minWidth: 0,
                    fontFeatureSettings: "'zero' 1",
                  }}
                >
                  <span className="min-w-0 truncate">{COMMS_PILL_LABEL.ev1}</span>
                  <span className="shrink-0">
                    <CommsPillChevron />
                  </span>
                </button>
                <button
                  type="button"
                  aria-pressed={commsFilter === 'ev2o2'}
                  onClick={() => setCommsFilter('ev2o2')}
                  title={COMMS_PILL_LABEL.ev2o2}
                  className={`flex min-h-[20px] min-w-0 items-center justify-center gap-0.5 rounded-[7.5px] px-0.5 font-['IBM_Plex_Sans',sans-serif] text-[11px] font-medium leading-tight text-[color:var(--starlight,#b9d3cd)] transition-colors ${
                    commsFilter === 'ev2o2' ? 'bg-[var(--moon-blue,#4662a3)] not-italic' : 'bg-[var(--royal-blue,#191f3c)] italic'
                  }`}
                  data-node-id="7383:106554"
                  style={{
                    flexGrow: commsPillFlexWeight(COMMS_PILL_LABEL.ev2o2, true),
                    flexShrink: 1,
                    flexBasis: 0,
                    minWidth: 0,
                    fontFeatureSettings: "'zero' 1",
                  }}
                >
                  <span className="min-w-0 truncate">{COMMS_PILL_LABEL.ev2o2}</span>
                  <span className="shrink-0">
                    <CommsPillChevron />
                  </span>
                </button>
                <button
                  type="button"
                  aria-pressed={commsFilter === 'ev2hr'}
                  onClick={() => setCommsFilter('ev2hr')}
                  className={`flex min-h-[20px] items-center justify-center whitespace-nowrap rounded-[7.5px] px-1 font-['IBM_Plex_Sans',sans-serif] text-[11px] font-medium leading-tight text-[color:var(--starlight,#b9d3cd)] transition-colors ${
                    commsFilter === 'ev2hr' ? 'bg-[var(--moon-blue,#4662a3)] not-italic' : 'bg-[var(--royal-blue,#191f3c)] italic'
                  }`}
                  data-node-id="7383:106556"
                  style={{
                    flexGrow: commsPillFlexWeight(COMMS_PILL_LABEL.ev2hr, false),
                    flexShrink: 0,
                    flexBasis: 'auto',
                    minWidth: 'max-content',
                    fontFeatureSettings: "'zero' 1",
                  }}
                >
                  {COMMS_PILL_LABEL.ev2hr}
                </button>
              </div>
            </div>
          </div>
          {/* Figma `7383:106564` Rectangle 2572 — label fits inside border */}
          <div
            className="absolute left-[22px] top-[16px] flex h-[29px] w-[179px] items-center justify-center overflow-hidden rounded-[10px] border border-solid border-[var(--pure-white,white)] opacity-65 px-2"
            data-node-id="7383:106564"
          >
            <span
              className="min-w-0 max-w-full truncate text-center font-['IBM_Plex_Sans',sans-serif] text-[11px] font-normal leading-tight text-white"
              style={{ fontFeatureSettings: "'zero' 1" }}
            >
              COMMS HISTORY
            </span>
          </div>
        </div>
        <div className="absolute h-[267px] left-[23px] overflow-clip top-[53px] w-[931px]" data-node-id="5758:27476">
          <div className="absolute bg-gradient-to-b from-[var(--royal-blue,#191f3c)] h-[44.895px] left-[7px] opacity-50 rounded-[7.015px] to-[rgba(26,61,100,0.7)] top-[61.55px] via-[rgba(82,109,130,0.1)] w-[853px]" data-node-id="5758:27477" />
          <div className="absolute h-[40px] left-[4px] overflow-clip top-[10px] w-[951px]" data-node-id="5758:27478">
            <div className="absolute border border-[var(--starlight,#b9d3cd)] border-dashed h-[38px] left-[3px] opacity-40 rounded-[7.5px] top-0 w-[853px]" data-node-id="5758:27479" data-name="Rounded rectangle" />
            <div className="-translate-y-1/2 absolute flex flex-col font-['IBM_Plex_Sans:Regular',sans-serif] h-[37px] justify-center leading-[0] left-[15px] not-italic text-[14px] text-[color:var(--moon-blue,#526d82)] top-[19.5px] w-[290px]" data-node-id="5758:27480">
              <p className="leading-[normal]">PR - Change path to go to POI 2 first.</p>
            </div>
            <div className="-translate-y-1/2 absolute flex flex-col font-['IBM_Plex_Sans:Medium',sans-serif] justify-center leading-[0] left-[876px] not-italic text-[12px] text-[color:var(--moon-blue,#526d82)] top-[20px] whitespace-nowrap" data-node-id="5758:27481">
              <time
                className="tabular-nums leading-[normal]"
                dateTime={formatElapsedHhMmSs(commsHistoryElapsedS)}
                data-node-id="7383:106570"
              >
                {formatElapsedHhMmSs(commsHistoryElapsedS)}
              </time>
            </div>
          </div>
          <div className="-translate-y-1/2 absolute flex flex-col font-['IBM_Plex_Sans:Regular',sans-serif] justify-center leading-[0] left-[19px] not-italic text-[14px] text-[color:var(--moon-blue,#526d82)] top-[84px] w-[159px]" data-node-id="5758:27482">
            <p className="leading-[normal]">Path Changed</p>
          </div>
          <div className="-translate-y-1/2 absolute flex flex-col font-['IBM_Plex_Sans:Medium',sans-serif] justify-center leading-[0] left-[880px] not-italic text-[12px] text-[color:var(--moon-blue,#526d82)] top-[84px] whitespace-nowrap" data-node-id="5758:27483">
            <time
              className="tabular-nums leading-[normal]"
              dateTime={formatElapsedHhMmSs(commsHistoryElapsedS)}
              data-node-id="7383:106572"
            >
              {formatElapsedHhMmSs(commsHistoryElapsedS)}
            </time>
          </div>
        </div>
      </div>
    </div>
  );
}