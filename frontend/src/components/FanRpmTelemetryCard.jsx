/** Figma `7383:106379` — FAN (PRI)/(SEC): plain rows + smooth teal bar from mock rpm. */

const FAN_PRI_RPM_MAX = 22
const FAN_SEC_RPM_MAX = 6

function FanRpmRow({ label, rpm, rpmMax, rowNodeId, barNodeId }) {
  const pct = Math.min(100, Math.max(0, (rpm / Math.max(rpmMax, 1e-6)) * 100))
  const text = rpm < 0.05 && label.includes('SEC') ? '0' : rpm.toFixed(1)

  return (
    <div className="flex w-full max-w-[218px] flex-col gap-2.5">
      <div
        className="flex w-[207px] max-w-full items-center justify-between font-['IBM_Plex_Sans',sans-serif] text-[14px]"
        data-node-id={rowNodeId}
      >
        <span className="w-[109px] text-white" style={{ fontFeatureSettings: "'zero' 1" }}>
          {label}
        </span>
        <div className="flex items-center pr-1.5">
          <span className="w-[34px] text-right text-white tabular-nums" style={{ fontFeatureSettings: "'zero' 1" }}>
            {text}
          </span>
          <span className="w-[36px] text-right text-[#b9d3cd]" style={{ fontFeatureSettings: "'zero' 1" }}>
            rpm
          </span>
        </div>
      </div>
      <div
        className="h-[3px] w-full max-w-[218px] overflow-hidden rounded-full bg-[#0f1724]"
        data-node-id={barNodeId}
        role="presentation"
      >
        <div
          className="h-full rounded-full bg-[#00b288]"
          style={{ width: `${pct}%`, transition: 'width 0.5s ease-out' }}
        />
      </div>
    </div>
  )
}

/**
 * @param {{ fanPriRpm: number, fanSecRpm: number }} props
 */
export default function FanRpmTelemetryCard({ fanPriRpm, fanSecRpm }) {
  return (
    <div
      className="relative h-[153px] min-h-[153px] w-full min-w-0 flex-1 overflow-hidden rounded-[12px] bg-gradient-to-b from-[rgba(26,61,100,0.3)] via-[52.404%] via-[rgba(6,15,28,0.3)] to-[93.75%] to-[rgba(26,61,100,0.3)] sm:max-w-[248px] sm:flex-none sm:w-[248px]"
      data-node-id="7383:106379"
    >
      <div className="flex flex-col gap-[11px] px-[19px] pt-[39px]" data-node-id="7383:106381">
        <div className="flex flex-col gap-2.5" data-node-id="7383:106382">
          <FanRpmRow
            label="FAN (PRI)"
            rpm={fanPriRpm}
            rpmMax={FAN_PRI_RPM_MAX}
            rowNodeId="7383:106384"
            barNodeId="7383:106390"
          />
        </div>
        <div className="flex flex-col gap-2.5" data-node-id="7383:106394">
          <FanRpmRow
            label="FAN (SEC)"
            rpm={fanSecRpm}
            rpmMax={FAN_SEC_RPM_MAX}
            rowNodeId="7383:106396"
            barNodeId="7383:106402"
          />
        </div>
      </div>
    </div>
  )
}
