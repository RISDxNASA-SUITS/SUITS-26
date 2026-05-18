import { useEffect, useRef, useState } from "react"
import { getAgentAlerts, getAgentStatus, getTelemetryWarnings } from "../api/client"
import { speakQueued } from "../utils/tts"

const WARNINGS_MS = 5000
const AGENT_MS = 2500

export function useEvaAlerts({ voiceAlerts = true } = {}) {
  const [warnings, setWarnings] = useState([])
  const [agentAlerts, setAgentAlerts] = useState([])
  const [agenticEnabled, setAgenticEnabled] = useState(false)
  const lastAgentAlertIdRef = useRef(0)
  const agentBootstrappedRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    const loadStatus = async () => {
      try {
        const s = await getAgentStatus()
        if (!cancelled) setAgenticEnabled(s.agentic_enabled)
      } catch {
        if (!cancelled) setAgenticEnabled(false)
      }
    }
    void loadStatus()
    const id = window.setInterval(() => void loadStatus(), 30_000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const tick = async () => {
      try {
        const w = await getTelemetryWarnings()
        if (!cancelled) setWarnings(w)
      } catch {
        /* ignore */
      }
    }
    void tick()
    const id = window.setInterval(() => void tick(), WARNINGS_MS)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [])

  useEffect(() => {
    if (!agenticEnabled) {
      setAgentAlerts([])
      agentBootstrappedRef.current = false
      lastAgentAlertIdRef.current = 0
      return
    }

    agentBootstrappedRef.current = false
    lastAgentAlertIdRef.current = 0
    let cancelled = false

    const tick = async () => {
      try {
        const items = await getAgentAlerts()
        if (cancelled) return
        setAgentAlerts(items)

        const maxId = items.length > 0 ? Math.max(...items.map((a) => a.id)) : 0
        if (!agentBootstrappedRef.current) {
          agentBootstrappedRef.current = true
          lastAgentAlertIdRef.current = maxId
          return
        }

        const prev = lastAgentAlertIdRef.current
        const fresh = items.filter((a) => a.id > prev).sort((a, b) => a.id - b.id)
        for (const a of fresh) {
          if (voiceAlerts) speakQueued(a.spoken_text.trim())
          lastAgentAlertIdRef.current = a.id
        }
      } catch {
        /* ignore */
      }
    }

    void tick()
    const id = window.setInterval(() => void tick(), AGENT_MS)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [agenticEnabled, voiceAlerts])

  return { warnings, agentAlerts, agenticEnabled }
}
