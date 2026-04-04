import { type FormEvent, useCallback, useRef, useState } from 'react'
import { postAsrTranscribe } from '../api/client'
import type { AsrTranscribeResponse } from '../types/api'

type VoicePhase = 'idle' | 'listening' | 'transcribing'

type Props = {
  onSubmit: (text: string) => void
  onVoiceResult: (result: AsrTranscribeResponse) => void
  /** True while audio is being sent to the ASR endpoint (assistant panel). */
  onVoiceTranscribing?: (active: boolean) => void
  disabled?: boolean
}

function pickRecorderMime(): string | undefined {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
  for (const c of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c)) {
      return c
    }
  }
  return undefined
}

export function CommandInput({ onSubmit, onVoiceResult, onVoiceTranscribing, disabled }: Props) {
  const [value, setValue] = useState('')
  const [voicePhase, setVoicePhase] = useState<VoicePhase>('idle')
  const [voiceErr, setVoiceErr] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const busy = disabled || voicePhase !== 'idle'

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const t = value.trim()
    if (!t || busy) return
    onSubmit(t)
    setValue('')
  }

  const startRecording = async () => {
    setVoiceErr(null)
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setVoiceErr('Microphone not available in this browser.')
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
        setVoicePhase('transcribing')
        onVoiceTranscribing?.(true)
        const blob = new Blob(chunksRef.current, {
          type: mr.mimeType || 'audio/webm',
        })
        void (async () => {
          try {
            const result = await postAsrTranscribe(blob, true)
            onVoiceResult(result)
          } catch (err) {
            onVoiceResult({
              success: false,
              transcript: '',
              normalized_text: '',
              error: err instanceof Error ? err.message : 'Voice request failed',
              command_result: null,
            })
          } finally {
            onVoiceTranscribing?.(false)
            setVoicePhase('idle')
          }
        })()
      }
      mr.onerror = () => {
        stopStream()
        setVoicePhase('idle')
        setVoiceErr('Recording error.')
      }
      mediaRecorderRef.current = mr
      mr.start(200)
      setVoicePhase('listening')
    } catch {
      setVoiceErr('Could not access microphone.')
    }
  }

  const stopRecording = () => {
    const mr = mediaRecorderRef.current
    if (mr && mr.state !== 'inactive') {
      mr.stop()
    }
    mediaRecorderRef.current = null
    if (voicePhase === 'listening') {
      /* onstop will set transcribing */
    }
  }

  const toggleVoice = () => {
    if (busy && voicePhase === 'idle') return
    if (voicePhase === 'listening') {
      stopRecording()
      return
    }
    if (voicePhase === 'transcribing') return
    void startRecording()
  }

  return (
    <div className="command-input-stack">
      <form className="command-form" onSubmit={handleSubmit}>
        <label htmlFor="eva-cmd" className="sr-only">
          EVA command
        </label>
        <input
          id="eva-cmd"
          type="text"
          autoComplete="off"
          placeholder="e.g. oxygen status, battery status, what phase am i in, help"
          value={value}
          disabled={busy}
          onChange={(e) => setValue(e.target.value)}
        />
        <button
          type="button"
          className={
            voicePhase === 'listening' ? 'command-voice command-voice--active' : 'command-voice'
          }
          disabled={disabled || voicePhase === 'transcribing'}
          onClick={toggleVoice}
          title={voicePhase === 'listening' ? 'Stop recording' : 'Speak command'}
          aria-pressed={voicePhase === 'listening'}
        >
          {voicePhase === 'listening' ? 'Stop' : 'Mic'}
        </button>
        <button type="submit" disabled={busy || !value.trim()}>
          Send
        </button>
      </form>
      {(voicePhase === 'listening' || voicePhase === 'transcribing') && (
        <p className="voice-status" role="status">
          {voicePhase === 'listening' ? 'Listening…' : 'Transcribing…'}
        </p>
      )}
      {voiceErr && <p className="voice-error">{voiceErr}</p>}
    </div>
  )
}
