import { useCallback, useEffect, useRef, useState } from "react"
import aiaIcon from "../../assets/map/AIA_Icon.svg"
import { postAsrTranscribe } from "../../api/client"
import { useEvaCommand } from "../../hooks/useEvaCommand"

function pickRecorderMime() {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"]
  for (const c of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c)) {
      return c
    }
  }
  return undefined
}

export function EvaCommandDock() {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")
  const [voicePhase, setVoicePhase] = useState("idle")
  const [voiceErr, setVoiceErr] = useState(null)
  const [voiceTranscribing, setVoiceTranscribing] = useState(false)
  const dockRef = useRef(null)

  const {
    lastResponse,
    cmdError,
    sending,
    voiceTrace,
    handleCommand,
    handleVoiceResult,
  } = useEvaCommand()

  const busy = sending || voicePhase !== "idle" || voiceTranscribing
  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e) => {
      if (dockRef.current && !dockRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [open])

  const onSubmit = (e) => {
    e.preventDefault()
    const t = value.trim()
    if (!t || busy) return
    void handleCommand(t)
    setValue("")
  }

  const startRecording = async () => {
    setVoiceErr(null)
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setVoiceErr("Microphone not available in this browser.")
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []
      const mime = pickRecorderMime()
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
      mr.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data)
      }
      mr.onstop = () => {
        stopStream()
        setVoicePhase("transcribing")
        setVoiceTranscribing(true)
        const blob = new Blob(chunksRef.current, {
          type: mr.mimeType || "audio/webm",
        })
        void (async () => {
          try {
            const result = await postAsrTranscribe(blob, true)
            handleVoiceResult(result)
          } catch (err) {
            handleVoiceResult({
              success: false,
              transcript: "",
              normalized_text: "",
              error: err instanceof Error ? err.message : "Voice request failed",
              command_result: null,
            })
          } finally {
            setVoiceTranscribing(false)
            setVoicePhase("idle")
          }
        })()
      }
      mr.onerror = () => {
        stopStream()
        setVoicePhase("idle")
        setVoiceErr("Recording error.")
      }
      mediaRecorderRef.current = mr
      mr.start(200)
      setVoicePhase("listening")
    } catch {
      setVoiceErr("Could not access microphone.")
    }
  }

  const stopRecording = () => {
    const mr = mediaRecorderRef.current
    if (mr && mr.state !== "inactive") mr.stop()
    mediaRecorderRef.current = null
  }

  const toggleVoice = () => {
    if (busy && voicePhase === "idle") return
    if (voicePhase === "listening") {
      stopRecording()
      return
    }
    if (voicePhase === "transcribing") return
    void startRecording()
  }

  const showToast =
    open &&
    (sending ||
      voiceTranscribing ||
      cmdError ||
      lastResponse ||
      (voiceTrace && (voiceTrace.transcript || voiceTrace.normalized)))

  return (
    <div ref={dockRef} className="eva-command-dock">
      {open && (
        <div className="eva-command-dock__panel">
          {showToast && (
            <div className="eva-command-toast" role="status" aria-live="polite">
              {(sending || voiceTranscribing) && (
                <p className="eva-command-toast__status">Processing command…</p>
              )}
              {cmdError && <p className="eva-command-toast__error">{cmdError}</p>}
              {voiceTrace?.transcript && (
                <p className="eva-command-toast__trace">
                  <span className="eva-command-toast__label">Heard:</span> {voiceTrace.transcript}
                </p>
              )}
              {lastResponse && (
                <p
                  className={
                    lastResponse.success === false
                      ? "eva-command-toast__message eva-command-toast__message--warn"
                      : "eva-command-toast__message"
                  }
                >
                  {lastResponse.response_text}
                </p>
              )}
            </div>
          )}
          <form className="eva-command-form" onSubmit={onSubmit}>
            <label htmlFor="eva-cmd" className="eva-sr-only">
              EVA command
            </label>
            <input
              id="eva-cmd"
              type="text"
              autoComplete="off"
              placeholder="Ask EVA…"
              value={value}
              disabled={busy}
              onChange={(e) => setValue(e.target.value)}
            />
            <button
              type="button"
              className={
                voicePhase === "listening"
                  ? "eva-command-mic eva-command-mic--active"
                  : "eva-command-mic"
              }
              disabled={sending || voicePhase === "transcribing"}
              onClick={toggleVoice}
              title={voicePhase === "listening" ? "Stop recording" : "Speak command"}
              aria-pressed={voicePhase === "listening"}
              aria-label={voicePhase === "listening" ? "Stop recording" : "Speak command"}
            >
              <MicIcon listening={voicePhase === "listening"} />
            </button>
            <button type="submit" className="eva-command-send" disabled={busy || !value.trim()}>
              Send
            </button>
          </form>
          {voicePhase === "listening" && (
            <p className="eva-command-voice-status" role="status">
              Listening…
            </p>
          )}
          {voiceErr && <p className="eva-command-voice-error">{voiceErr}</p>}
        </div>
      )}
      <button
        type="button"
        className={`eva-command-fab${open ? " eva-command-fab--open" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? "Close EVA assistant" : "Open EVA assistant"}
      >
        <img src={aiaIcon} alt="" aria-hidden="true" />
      </button>
    </div>
  )
}

function MicIcon({ listening }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
      {listening && <circle cx="12" cy="12" r="10" strokeOpacity="0.35" />}
    </svg>
  )
}
