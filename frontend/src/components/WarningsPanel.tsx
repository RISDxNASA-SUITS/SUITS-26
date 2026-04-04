import type { WarningItem } from '../types/api'

type Props = {
  warnings: WarningItem[]
  loading: boolean
  error: string | null
}

export function WarningsPanel({ warnings, loading, error }: Props) {
  return (
    <section className="panel warnings-panel" aria-labelledby="alerts-heading">
      <h2 id="alerts-heading" className="panel-heading">
        Alerts
      </h2>
      {loading && <p className="muted">Loading…</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && warnings.length === 0 && (
        <p className="muted all-clear">No active warnings.</p>
      )}
      {!loading && !error && warnings.length > 0 && (
        <ul className="warning-list">
          {warnings.map((w) => (
            <li key={w.code} className={`warning-item sev-${w.severity}`}>
              <span className="warning-code mono">{w.code}</span>
              <span className="warning-msg">{w.message}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
