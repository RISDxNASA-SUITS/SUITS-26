import { useCallback, useState } from "react"
import { postCommand } from "../api/client"
import { speak, stop } from "../utils/tts"

export function useEvaCommand({ voiceOutput = true } = {}) {
  const [lastResponse, setLastResponse] = useState(null)
  const [cmdError, setCmdError] = useState(null)
  const [sending, setSending] = useState(false)
  const [voiceTrace, setVoiceTrace] = useState(null)

  const handleCommand = useCallback(
    async (text) => {
      stop()
      setSending(true)
      setCmdError(null)
      setVoiceTrace(null)
      try {
        const res = await postCommand({ text })
        setLastResponse(res)
        if (voiceOutput && res.success && res.response_text?.trim()) {
          speak(res.response_text.trim())
        }
      } catch (e) {
        setLastResponse(null)
        setCmdError(e instanceof Error ? e.message : "Request failed")
      } finally {
        setSending(false)
      }
    },
    [voiceOutput],
  )

  const handleVoiceResult = useCallback(
    (r) => {
      stop()
      setCmdError(null)
      setVoiceTrace({
        transcript: r.transcript,
        normalized: r.normalized_text,
      })
      if (!r.success) {
        setLastResponse(null)
        setCmdError(r.error || "Unable to transcribe command.")
        return
      }
      if (r.command_result) {
        const mapped = {
          success: r.command_result.success,
          error_code: r.command_result.error_code,
          input_text: r.normalized_text,
          parsed_intent: r.command_result.intent,
          entity: r.command_result.entity,
          response_text: r.command_result.response_text,
        }
        setLastResponse(mapped)
        if (voiceOutput && mapped.success && mapped.response_text?.trim()) {
          speak(mapped.response_text.trim())
        }
      } else {
        setLastResponse(null)
      }
    },
    [voiceOutput],
  )

  const clearResponse = useCallback(() => {
    setLastResponse(null)
    setCmdError(null)
    setVoiceTrace(null)
  }, [])

  return {
    lastResponse,
    cmdError,
    sending,
    voiceTrace,
    handleCommand,
    handleVoiceResult,
    clearResponse,
  }
}
