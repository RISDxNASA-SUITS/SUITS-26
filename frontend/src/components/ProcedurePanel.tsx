import { useEffect, useState } from 'react'
import {
  getProcedureList,
  postProcedureNext,
  postProcedureRepeat,
  postProcedureStart,
} from '../api/client'
import type { ProcedureCurrentState, ProcedureSummary } from '../types/api'

type Props = {
  current: ProcedureCurrentState | null
  loading: boolean
  error: string | null
  onRefreshContext: () => Promise<void>
}

export function ProcedurePanel({ current, loading, error, onRefreshContext }: Props) {
  const [list, setList] = useState<ProcedureSummary[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [lastBackendMessage, setLastBackendMessage] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void getProcedureList()
      .then((rows) => {
        setList(rows)
        if (rows.length) setSelectedId((prev) => prev || rows[0].procedure_id)
      })
      .catch(() => {
        /* list load failure; Start dropdown stays empty */
      })
  }, [])

  async function runAction(fn: () => Promise<{ message: string }>) {
    setBusy(true)
    setActionError(null)
    try {
      const r = await fn()
      setLastBackendMessage(r.message)
      await onRefreshContext()
    } catch (e) {
      setLastBackendMessage(null)
      setActionError(e instanceof Error ? e.message : 'Procedure action failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="panel procedure-panel" aria-labelledby="proc-heading">
      <h2 id="proc-heading" className="panel-heading">
        Procedure
      </h2>
      {loading && <p className="muted">Loading…</p>}
      {error && <p className="error">{error}</p>}

      {lastBackendMessage && (
        <p className="procedure-feedback" role="status">
          {lastBackendMessage}
        </p>
      )}
      {actionError && <p className="error">{actionError}</p>}

      {!loading && !error && current && (
        <>
          {current.active ? (
            <div className="procedure-active">
              <p className="proc-title">{current.title}</p>
              <p className="muted proc-meta">
                {current.procedure_id}
                {current.step_index != null && current.step_count != null && (
                  <>
                    {' '}
                    · Step {current.step_index + 1} / {current.step_count}
                  </>
                )}
              </p>
              {current.current_step_id && (
                <p className="mono step-id">ID: {current.current_step_id}</p>
              )}
              <p className="instruction">{current.instruction}</p>
              {current.check_key && (
                <p className="muted check-key">
                  Check: <span className="mono">{current.check_key}</span>
                </p>
              )}
              <div className="row proc-actions">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void runAction(() => postProcedureNext())}
                >
                  Next
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void runAction(() => postProcedureRepeat())}
                >
                  Repeat
                </button>
              </div>
            </div>
          ) : (
            <p className="muted">No active procedure. Start one below or use voice commands.</p>
          )}

          <div className="procedure-start">
            <label htmlFor="proc-select">Start procedure</label>
            <div className="row">
              <select
                id="proc-select"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                disabled={busy || list.length === 0}
              >
                {list.map((p) => (
                  <option key={p.procedure_id} value={p.procedure_id}>
                    {p.procedure_id} — {p.title} ({p.allowed_phase})
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={busy || !selectedId}
                onClick={() =>
                  void runAction(() => postProcedureStart({ procedure_id: selectedId }))
                }
              >
                Start
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
