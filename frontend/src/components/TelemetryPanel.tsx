import { type FormEvent, useState } from 'react'
import type { TelemetrySnapshot } from '../types/api'

type Props = {
  data: TelemetrySnapshot | null
  loading: boolean
  error: string | null
  onRefresh: () => Promise<void>
  onPatch: (patch: { battery_pct?: number; primary_o2_pct?: number }) => Promise<void>
}

export function TelemetryPanel({ data, loading, error, onRefresh, onPatch }: Props) {
  const [battery, setBattery] = useState('')
  const [primaryO2, setPrimaryO2] = useState('')
  const [busy, setBusy] = useState(false)

  async function handlePatch(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const patch: { battery_pct?: number; primary_o2_pct?: number } = {}
      if (battery.trim() !== '') {
        patch.battery_pct = Number(battery)
      }
      if (primaryO2.trim() !== '') {
        patch.primary_o2_pct = Number(primaryO2)
      }
      if (Object.keys(patch).length === 0) return
      await onPatch(patch)
      setBattery('')
      setPrimaryO2('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="panel telemetry-panel" aria-labelledby="tel-heading">
      <div className="panel-head">
        <h2 id="tel-heading" className="panel-heading">
          Telemetry
        </h2>
        <button type="button" className="btn-secondary" onClick={() => void onRefresh()} disabled={loading || busy}>
          Refresh
        </button>
      </div>
      {loading && <p className="muted">Loading…</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && data && (
        <>
          <dl className="kv">
            <div>
              <dt>Primary O₂</dt>
              <dd>{data.primary_o2_pct.toFixed(1)} %</dd>
            </div>
            <div>
              <dt>Secondary O₂</dt>
              <dd>{data.secondary_o2_pct.toFixed(1)} %</dd>
            </div>
            <div>
              <dt>Battery</dt>
              <dd>{data.battery_pct.toFixed(1)} %</dd>
            </div>
            <div>
              <dt>CO₂</dt>
              <dd>{data.co2_status}</dd>
            </div>
            <div>
              <dt>Comms</dt>
              <dd>{data.comms_status}</dd>
            </div>
            <div>
              <dt>Safe range</dt>
              <dd>{data.safe_range_m.toFixed(1)} m</dd>
            </div>
            <div>
              <dt>LTV</dt>
              <dd>{data.ltv_status}</dd>
            </div>
          </dl>
          <form className="telemetry-patch" onSubmit={(e) => void handlePatch(e)}>
            <p className="hint">Mock update (partial POST /telemetry/update)</p>
            <div className="row">
              <label>
                Primary O₂ %
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  placeholder="—"
                  value={primaryO2}
                  onChange={(e) => setPrimaryO2(e.target.value)}
                  disabled={busy}
                />
              </label>
              <label>
                Battery %
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  placeholder="—"
                  value={battery}
                  onChange={(e) => setBattery(e.target.value)}
                  disabled={busy}
                />
              </label>
              <button type="submit" disabled={busy}>
                Apply
              </button>
            </div>
          </form>
        </>
      )}
    </section>
  )
}
