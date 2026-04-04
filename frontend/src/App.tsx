import { useCallback, useEffect, useRef, useState } from 'react'
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
  AsrTranscribeResponse,
  CommandResponse,
  MissionPhase,
  MissionState,
  ProcedureCurrentState,
  TelemetrySnapshot,
  WarningItem,
} from './types/api'
import './App.css'
import { speak, stop } from './utils/tts'

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
  const [voiceTrace, setVoiceTrace] = useState<{ transcript: string; normalized: string } | null>(
    null,
  )
  const [voiceTranscribing, setVoiceTranscribing] = useState(false)
  /** Read aloud assistant reply (Web Speech API); default on for demo. */
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(true)
  const lastSpokenSigRef = useRef<string | null>(null)

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

  useEffect(() => {
    if (!voiceOutputEnabled) return
    if (!lastResponse?.success) {
      if (lastResponse && !lastResponse.success) stop()
      return
    }
    const text = lastResponse.response_text.trim()
    if (!text) return
    const sig = JSON.stringify({
      in: lastResponse.input_text,
      out: lastResponse.response_text,
      intent: lastResponse.parsed_intent,
      entity: lastResponse.entity,
    })
    if (sig === lastSpokenSigRef.current) return
    lastSpokenSigRef.current = sig
    speak(text)
  }, [lastResponse, voiceOutputEnabled])

  async function handleCommand(text: string) {
    stop()
    setSending(true)
    setCmdError(null)
    setVoiceTrace(null)
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

  function handleVoiceResult(r: AsrTranscribeResponse) {
    stop()
    setCmdError(null)
    setVoiceTrace({
      transcript: r.transcript,
      normalized: r.normalized_text,
    })
    if (!r.success) {
      setLastResponse(null)
      setCmdError(r.error || 'Unable to transcribe command.')
      return
    }
    if (r.command_result) {
      const mapped: CommandResponse = {
        success: r.command_result.success,
        error_code: r.command_result.error_code,
        input_text: r.normalized_text,
        parsed_intent: r.command_result.intent,
        entity: r.command_result.entity,
        response_text: r.command_result.response_text,
      }
      setLastResponse(mapped)
      void refreshContext()
    } else {
      setLastResponse(null)
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
        <div className="console-header-meta">
          <label className="tts-toggle">
            <input
              type="checkbox"
              checked={voiceOutputEnabled}
              onChange={(e) => {
                const on = e.target.checked
                setVoiceOutputEnabled(on)
                if (!on) stop()
                else lastSpokenSigRef.current = null
              }}
            />
            <span>Voice output</span>
          </label>
          <span className="console-pill" aria-hidden="true">
            demo
          </span>
        </div>
      </header>

      <div className="console-grid">
        <div className="console-primary">
          <section className="panel panel-command" aria-labelledby="cmd-heading">
            <h2 id="cmd-heading" className="panel-heading">
              Command
            </h2>
            <p className="panel-lead">
              Type commands or use the mic — voice is transcribed locally, normalized, then parsed (same as text).
            </p>
            <CommandInput
              onSubmit={handleCommand}
              onVoiceResult={handleVoiceResult}
              onVoiceTranscribing={setVoiceTranscribing}
              disabled={sending}
            />
          </section>

          <ResponsePanel
            response={lastResponse}
            error={cmdError}
            sending={sending || voiceTranscribing}
            voiceTrace={voiceTrace}
          />
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
