import { useCallback, useEffect, useState } from 'react'
import {
  getMission,
  getProcedureCurrent,
  getTelemetry,
  getTelemetryWarnings,
  postCommand,
  postMissionPhase,
  postTelemetryUpdate,
} from './api/client'
import { CommandInput } from './components/CommandInput'
import { MissionPanel } from './components/MissionPanel'
import { ProcedurePanel } from './components/ProcedurePanel'
import { ResponsePanel } from './components/ResponsePanel'
import { TelemetryPanel } from './components/TelemetryPanel'
import { WarningsPanel } from './components/WarningsPanel'
import type {
  CommandResponse,
  MissionPhase,
  MissionState,
  ProcedureCurrentState,
  TelemetrySnapshot,
  WarningItem,
} from './types/api'
import './App.css'

export default function App() {
  const [telemetry, setTelemetry] = useState<TelemetrySnapshot | null>(null)
  const [warnings, setWarnings] = useState<WarningItem[]>([])
  const [mission, setMission] = useState<MissionState | null>(null)
  const [procedure, setProcedure] = useState<ProcedureCurrentState | null>(null)
  const [ctxLoading, setCtxLoading] = useState(true)
  const [ctxError, setCtxError] = useState<string | null>(null)

  const [lastResponse, setLastResponse] = useState<CommandResponse | null>(null)
  const [cmdError, setCmdError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  const refreshContext = useCallback(async () => {
    setCtxError(null)
    setCtxLoading(true)
    try {
      const [t, w, m, p] = await Promise.all([
        getTelemetry(),
        getTelemetryWarnings(),
        getMission(),
        getProcedureCurrent(),
      ])
      setTelemetry(t)
      setWarnings(w)
      setMission(m)
      setProcedure(p)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load context'
      setCtxError(msg)
    } finally {
      setCtxLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshContext()
  }, [refreshContext])

  async function handleCommand(text: string) {
    setSending(true)
    setCmdError(null)
    try {
      const res = await postCommand({ text })
      setLastResponse(res)
      await refreshContext()
    } catch (e) {
      setLastResponse(null)
      setCmdError(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setSending(false)
    }
  }

  async function handleSetPhase(phase: MissionPhase) {
    const m = await postMissionPhase({ phase })
    setMission(m)
  }

  async function handleTelemetryPatch(patch: { battery_pct?: number; primary_o2_pct?: number }) {
    await postTelemetryUpdate(patch)
    await refreshContext()
  }

  return (
    <div className="console">
      <header className="console-header">
        <div className="console-brand">
          <h1 className="console-title">EVA AIA</h1>
          <p className="console-subtitle">
            Mission assistant · deterministic copilot · default demo: EGRESS + live mock telemetry
          </p>
        </div>
        <div className="console-header-meta" aria-hidden="true">
          <span className="console-pill">demo</span>
        </div>
      </header>

      <div className="console-grid">
        <div className="console-primary">
          <section className="panel panel-command" aria-labelledby="cmd-heading">
            <h2 id="cmd-heading" className="panel-heading">
              Command
            </h2>
            <p className="panel-lead">Natural-language commands route to the same engine as future voice input.</p>
            <CommandInput onSubmit={handleCommand} disabled={sending} />
          </section>

          <ResponsePanel response={lastResponse} error={cmdError} sending={sending} />
        </div>

        <aside className="console-side" aria-label="Mission context">
          <MissionPanel
            mission={mission}
            loading={ctxLoading}
            error={ctxError}
            onSetPhase={handleSetPhase}
          />
          <WarningsPanel warnings={warnings} loading={ctxLoading} error={ctxError} />
          <TelemetryPanel
            data={telemetry}
            loading={ctxLoading}
            error={ctxError}
            onRefresh={refreshContext}
            onPatch={handleTelemetryPatch}
          />
          <ProcedurePanel
            current={procedure}
            loading={ctxLoading}
            error={ctxError}
            onRefreshContext={refreshContext}
          />
        </aside>
      </div>
    </div>
  )
}
