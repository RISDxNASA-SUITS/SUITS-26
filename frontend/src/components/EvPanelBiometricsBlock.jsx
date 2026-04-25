import { useEffect, useState } from 'react'
import { suitsTelemetryMock } from '../mock/suitsTelemetryMock'
import { iteration4Ls } from '../assets/figmaAssets'

const emptyHist = { heartRateBpm: [], coreTempF: [], respRate: [], spo2: [] }

function vitalsTrendDir(series, band) {
  if (!series?.length || series.length < 2) return 'flat'
  const d = series[series.length - 1] - series[series.length - 2]
  if (d > band) return 'up'
  if (d < -band) return 'down'
  return 'flat'
}

/** Figma `7383:106412` / `106421` — `<img>` + smooth transform from `crewHistory` */
function VitalsTrendGlyph({ series, band, className = 'size-[50px]' }) {
  const dir = vitalsTrendDir(series, band)
  const src = dir === 'flat' ? iteration4Ls.vitalsTrendFlat : iteration4Ls.vitalsTrendUp
  const transform = dir === 'down' ? 'rotate(180deg)' : 'none'
  return (
    <div className={className} data-name="trend-glyph">
      <img
        alt=""
        src={src}
        className="block size-full max-w-none object-contain transition-transform duration-500 ease-out"
        style={{ transform }}
        draggable={false}
      />
    </div>
  )
}

const cardShell =
  'relative min-h-[136px] h-[136px] min-w-0 w-full overflow-hidden rounded-[10px] bg-[var(--midnight-blue,#060f1c)]'
const headerRule =
  'pointer-events-none absolute inset-x-0 top-0 h-10 rounded-t-[10px] border-[1.25px] border-b-0 border-[rgba(82,109,130,0.5)]'
const valueTransition = 'transition-[opacity,transform] duration-300 ease-out'

/**
 * EV 生命体征四宫格（`suitsTelemetryMock`）。Figma `7383:106406` — 2×2 田字格：`106407` / `106416` / `106425` / `106434`。
 * @param {{ layout?: 'evColumn' | 'suitsColumn', evLabel?: string, crewIdText?: string, telemetrySlot?: 'suits1' | 'suits2' }} props
 */
export default function EvPanelBiometricsBlock({
  layout = 'evColumn',
  evLabel = 'EV 1',
  crewIdText,
  telemetrySlot = 'suits1',
}) {
  const [full, setFull] = useState(() => suitsTelemetryMock.getSnapshot())
  useEffect(() => suitsTelemetryMock.subscribe(setFull), [])
  const live = full[telemetrySlot]
  const v = live.crewVitals
  const hist = live.crewHistory ?? emptyHist

  const gridShell =
    layout === 'evColumn'
      ? 'absolute left-[12px] top-[9px] grid w-[419px] grid-cols-2 grid-rows-2 gap-[5px] content-start'
      : 'relative mx-auto grid w-full max-w-[419px] grid-cols-2 grid-rows-2 gap-[5px] content-start pt-[9px]'

  const vitalsGrid = (
    <div className={gridShell} data-node-id="7383:106406">
      {/* 左上 — Figma `7383:106407` */}
      <div className={cardShell} data-node-id="7383:106407">
        <div className={headerRule} data-node-id="7383:106415" />
        <p
          className="-translate-y-1/2 absolute left-4 top-5 font-['IBM_Plex_Sans',sans-serif] text-[20px] leading-none text-[#919ead]"
          style={{ fontFeatureSettings: "'zero' 1" }}
          data-node-id="7383:106408"
        >
          HR (Heart Rate)
        </p>
        <div className="absolute left-4 top-10 h-[75px] w-[92px]" data-node-id="7383:106409">
          <p
            className={`-translate-x-1/2 -translate-y-1/2 absolute left-[43.5px] top-[31px] font-['IBM_Plex_Sans',sans-serif] text-[48px] font-medium leading-none text-[#ffa600] ${valueTransition} tabular-nums`}
            style={{ fontFeatureSettings: "'zero' 1" }}
            data-node-id="7383:106411"
          >
            {Math.round(v.heartRateBpm)}
          </p>
          <p
            className="-translate-y-1/2 absolute left-[7.75px] top-[65.75px] font-['IBM_Plex_Sans',sans-serif] text-sm text-white"
            style={{ fontFeatureSettings: "'zero' 1" }}
            data-node-id="7383:106410"
          >
            bpm
          </p>
        </div>
        <div className="absolute left-[146px] top-[52px] size-[50px]" data-node-id="7383:106412">
          <VitalsTrendGlyph series={hist.heartRateBpm} band={1} className="size-[50px]" />
        </div>
      </div>

      {/* 右上 — Figma `7383:106416` */}
      <div className={cardShell} data-node-id="7383:106416">
        <div className={headerRule} data-node-id="7383:106424" />
        <p
          className="-translate-y-1/2 absolute left-4 top-5 font-['IBM_Plex_Sans',sans-serif] text-[20px] leading-none text-[#919ead]"
          style={{ fontFeatureSettings: "'zero' 1" }}
          data-node-id="7383:106417"
        >
          SpO2
        </p>
        <div className="absolute left-4 top-10 h-[75px] w-[92px]" data-node-id="7383:106418">
          <p
            className={`-translate-y-1/2 absolute left-0 top-[31px] font-['IBM_Plex_Sans',sans-serif] text-[48px] font-medium leading-none text-[#00b288] ${valueTransition} tabular-nums`}
            style={{ fontFeatureSettings: "'zero' 1" }}
            data-node-id="7383:106420"
          >
            {Math.round(v.spo2)}
          </p>
          <p
            className="-translate-y-1/2 absolute left-[7.75px] top-[65.75px] font-['IBM_Plex_Sans',sans-serif] text-sm text-white"
            style={{ fontFeatureSettings: "'zero' 1" }}
            data-node-id="7383:106419"
          >
            %
          </p>
        </div>
        <div className="absolute left-[146px] top-[52px] size-[50px]" data-node-id="7383:106421">
          <VitalsTrendGlyph series={hist.spo2} band={0.5} className="size-[50px]" />
        </div>
      </div>

      {/* 左下 — Figma `7383:106425` */}
      <div className={cardShell} data-node-id="7383:106425">
        <div className={headerRule} data-node-id="7383:106433" />
        <p
          className="-translate-y-1/2 absolute left-4 top-5 font-['IBM_Plex_Sans',sans-serif] text-[20px] leading-none text-[#919ead]"
          style={{ fontFeatureSettings: "'zero' 1" }}
          data-node-id="7383:106426"
        >
          Core Body Temp
        </p>
        <div className="absolute left-4 top-10 h-[75px] w-[92px]" data-node-id="7383:106427">
          <p
            className={`-translate-y-1/2 absolute left-0 top-[31px] font-['IBM_Plex_Sans',sans-serif] text-[48px] font-medium leading-none text-[#00b288] ${valueTransition} tabular-nums`}
            style={{ fontFeatureSettings: "'zero' 1" }}
            data-node-id="7383:106429"
          >
            {v.coreTempF.toFixed(1)}
          </p>
          <p
            className="-translate-y-1/2 absolute left-[7.75px] top-[65.75px] font-['IBM_Plex_Sans',sans-serif] text-sm text-white"
            style={{ fontFeatureSettings: "'zero' 1" }}
            data-node-id="7383:106428"
          >
            °F
          </p>
        </div>
        <div className="absolute left-[146px] top-[52px] size-[50px]" data-node-id="7383:106430">
          <VitalsTrendGlyph series={hist.coreTempF} band={0.06} className="size-[50px]" />
        </div>
      </div>

      {/* 右下 — Figma `7383:106434` */}
      <div className={cardShell} data-node-id="7383:106434">
        <div className={headerRule} data-node-id="7383:106442" />
        <p
          className="-translate-y-1/2 absolute left-4 top-5 max-w-[min(180px,100%)] font-['IBM_Plex_Sans',sans-serif] text-[20px] leading-tight text-[#919ead]"
          style={{ fontFeatureSettings: "'zero' 1" }}
          data-node-id="7383:106435"
        >
          Respiration Rate
        </p>
        <div className="absolute left-4 top-10 h-[75px] w-[120px]" data-node-id="7383:106436">
          <p
            className={`-translate-y-1/2 absolute left-0 top-[31px] font-['IBM_Plex_Sans',sans-serif] text-[48px] font-medium leading-none text-[#ffa600] ${valueTransition} tabular-nums`}
            style={{ fontFeatureSettings: "'zero' 1" }}
            data-node-id="7383:106438"
          >
            {Math.round(v.respRate)}
          </p>
          <p
            className="-translate-y-1/2 absolute left-0 top-[65.75px] whitespace-nowrap font-['IBM_Plex_Sans',sans-serif] text-xs text-white"
            style={{ fontFeatureSettings: "'zero' 1" }}
            data-node-id="7383:106437"
          >
            Breaths/mins
          </p>
        </div>
        <div className="absolute left-[146px] top-[52px] size-[50px]" data-node-id="7383:106439">
          <VitalsTrendGlyph series={hist.respRate} band={0.5} className="size-[50px]" />
        </div>
      </div>
    </div>
  )

  if (layout === 'suitsColumn') {
    return (
      <div className="mt-6 w-full shrink-0 px-3" data-name="ev-biometrics-suits" data-node-id="7383:106278">
        <div className="relative h-[46px] w-[162px]">
          <div
            className="absolute left-0 top-0 flex h-[46px] w-[162px] items-center gap-2 overflow-hidden rounded-[12px] border border-[#6b8bae] bg-[rgba(6,15,28,0.35)] px-4 py-2.5 backdrop-blur-[50px]"
            data-node-id="7383:106279"
          >
            <div className="relative h-[25px] w-[26px] shrink-0" data-node-id="I7383:106279;6601:28753">
              <img alt="" className="absolute inset-0 block size-full max-w-none" src={iteration4Ls.evIcon} />
            </div>
            <p
              className="font-['IBM_Plex_Sans',sans-serif] text-[20px] font-medium leading-none text-[#b9d3cd]"
              data-node-id="I7383:106279;6601:28751"
            >
              {evLabel}
            </p>
          </div>
          <div className="absolute left-[104px] top-px h-[45px] w-[46px]" data-node-id="7383:106280">
            <div className="absolute left-[6px] top-[5px] size-[34px] overflow-hidden rounded-full bg-white" data-node-id="7383:106281">
              <div
                className="absolute left-[-5px] top-[-6px] flex h-[109px] w-[51px] items-center justify-center border-[#060f1c] border-[3.301px] border-solid"
                data-node-id="7383:106282"
              >
                <img
                  alt=""
                  className="absolute max-h-[84%] max-w-none -translate-x-[6%] -translate-y-[7%]"
                  src={iteration4Ls.profilePhoto}
                />
              </div>
            </div>
          </div>
        </div>

        {crewIdText ? (
          <div className="mx-3 mt-2 flex justify-end" data-node-id="7383:106108">
            <p
              className="font-['Inter',sans-serif] text-[14px] font-normal leading-normal text-[#919ead] opacity-50"
              data-node-id="7383:106109"
            >
              {crewIdText}
            </p>
          </div>
        ) : null}

        <div
          className="relative mx-auto mt-5 h-[295px] w-full max-w-[462px] overflow-hidden rounded-[15px] bg-gradient-to-b from-[var(--midnight-blue,#060f1c)] to-[96.154%] to-[var(--midnight-blue,#060f1c)] via-[rgba(82,109,130,0.1)]"
          data-node-id="7383:106405"
        >
          <div className="px-[22px] pt-2">{vitalsGrid}</div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="-translate-x-1/2 absolute left-[calc(50%-0.63px)] top-[458.75px] h-[295px] w-[443.75px] overflow-clip rounded-[15px] bg-gradient-to-b from-[var(--midnight-blue,#060f1c)] to-[96.154%] to-[var(--midnight-blue,#060f1c)] via-[rgba(82,109,130,0.1)]"
      data-node-id="7383:106405"
    >
      {vitalsGrid}
    </div>
  )
}
