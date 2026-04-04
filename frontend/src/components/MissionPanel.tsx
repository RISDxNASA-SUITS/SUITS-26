import { useEffect, useState } from 'react'
import type { MissionPhase, MissionState } from '../types/api'

const PHASES: MissionPhase[] = [
  'INIT',
  'PR_SEARCH',
  'EGRESS',
  'EVA_NAV',
  'LTV_REPAIR',
  'INGRESS',
  'COMPLETE',
]

type Props = {
  mission: MissionState | null
  loading: boolean
  error: string | null
  onSetPhase: (phase: MissionPhase) => Promise<void>
}

export function MissionPanel({ mission, loading, error, onSetPhase }: Props) {
  const [selected, setSelected] = useState<MissionPhase>('INIT')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (mission) setSelected(mission.phase)
  }, [mission])

  async function apply() {
    setBusy(true)
    try {
      await onSetPhase(selected)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="panel mission-panel" aria-labelledby="mission-heading">
      <h2 id="mission-heading" className="panel-heading">
        Mission status
      </h2>
      {loading && <p className="muted">Loading…</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && mission && (
        <>
          <p className="phase-current">
            Current phase: <span className="mono phase-badge">{mission.phase}</span>
          </p>
          <div className="row">
            <label htmlFor="phase-select" className="sr-only">
              Set mission phase
            </label>
            <select
              id="phase-select"
              value={selected}
              onChange={(e) => setSelected(e.target.value as MissionPhase)}
              disabled={busy}
            >
              {PHASES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <button type="button" onClick={() => void apply()} disabled={busy}>
              Set phase
            </button>
          </div>
        </>
      )}
    </section>
  )
}
