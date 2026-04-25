/**
 * Figma `7383:106368` — LCVG Flow Rate: DOM only, smooth fill vs `lcvgFlowLbHr` / max.
 *
 * @param {{ flowLbHr: number, flowMax: number, flowNorm?: number }} props
 */
export default function LcvgFlowRateGauge({ flowLbHr, flowMax, flowNorm }) {
  const norm =
    typeof flowNorm === 'number'
      ? Math.min(1, Math.max(0, flowNorm))
      : Math.min(1, Math.max(0, flowLbHr / Math.max(flowMax, 1)))
  const fillPct = norm * 100

  return (
    <div
      className="relative h-[153px] w-full shrink-0 overflow-hidden rounded-[12px] bg-gradient-to-b from-[rgba(26,61,100,0.3)] via-[52.404%] via-[rgba(6,15,28,0.3)] to-[93.75%] to-[rgba(26,61,100,0.3)] sm:w-[178px]"
      data-node-id="7383:106368"
    >
      <div
        className="-translate-y-1/2 absolute left-[15px] top-[19px] flex h-[22px] flex-col justify-center font-['IBM_Plex_Sans',sans-serif] text-[14px] text-white"
        style={{ fontFeatureSettings: "'zero' 1" }}
        data-node-id="7383:106369"
      >
        LCVG Flow Rate
      </div>

      <div className="absolute left-[34px] top-[47px] h-[70px] w-[59px]" data-node-id="7383:106376">
        <div
          className="absolute left-0 top-0 h-[70px] w-[31px] overflow-hidden rounded-[12px] border border-[#191f3c] bg-[#060f1c]"
          data-node-id="7383:106377"
        >
          <div
            className="absolute bottom-0 left-px w-[30px] rounded-bl-[11px] rounded-br-[11px] bg-[#00b288]"
            style={{
              height: `${fillPct}%`,
              minHeight: norm > 0.01 ? '4px' : '0px',
              transition: 'height 0.5s ease-out',
            }}
            data-node-id="7383:106378"
          />
        </div>
      </div>

      <div className="absolute left-[82px] top-[60px] flex flex-col items-start gap-0.5 text-center leading-none" data-node-id="7383:106373">
        <span
          className="font-['IBM_Plex_Sans',sans-serif] text-[24px] font-bold text-white tabular-nums"
          style={{ fontFeatureSettings: "'zero' 1" }}
          data-node-id="7383:106374"
        >
          {Math.round(flowLbHr)}
        </span>
        <span className="font-['IBM_Plex_Sans',sans-serif] text-[14px] text-[#526d82]" style={{ fontFeatureSettings: "'zero' 1" }} data-node-id="7383:106375">
          lb/hr
        </span>
      </div>
    </div>
  )
}
