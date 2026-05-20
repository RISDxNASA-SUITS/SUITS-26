import React, { createContext, useState, useCallback, useEffect, useRef, useMemo } from "react"
import { getHubUrl, getHubWsBase, setHubUrl as persistHubUrl } from "../api/hubConfig"
import { hubTelemetryLiveWsUrl } from "../api/hubClient"
import { connectHubWebSocket } from "../api/hubWebSocket"

/** @typedef {'idle' | 'connecting' | 'open' | 'closed' | 'error'} WsStatus */

export const HubConfigContext = createContext(null)

export function HubConfigProvider({ children }) {
  const [hubUrl, setHubUrlState] = useState(() => getHubUrl())
  const [hubPromptDismissed, setHubPromptDismissed] = useState(false)
  const [wsStatus, setWsStatus] = useState(/** @type {WsStatus} */ ("idle"))
  const [wsError, setWsError] = useState(/** @type {string | null} */ (null))
  const [liveTelemetry, setLiveTelemetry] = useState(
    /** @type {import('../api/hubLiveTelemetry').LiveTelemetryPayload | null} */ (null),
  )
  const wsRef = useRef(/** @type {{ close: () => void } | null} */ (null))

  const isHubConfigured = Boolean(hubUrl)

  const handleSaveHubUrl = useCallback((url) => {
    const normalized = persistHubUrl(url)
    setHubUrlState(normalized)
    setHubPromptDismissed(true)
    if (!normalized) {
      setLiveTelemetry(null)
      setWsStatus("idle")
      setWsError(null)
    }
  }, [])

  const clearHubUrl = useCallback(() => {
    persistHubUrl("")
    setHubUrlState("")
    setLiveTelemetry(null)
    setWsStatus("idle")
    setWsError(null)
    setHubPromptDismissed(false)
  }, [])

  useEffect(() => {
    wsRef.current?.close()
    wsRef.current = null

    if (!hubUrl) {
      setWsStatus("idle")
      setWsError(null)
      return
    }

    const wsUrl = hubTelemetryLiveWsUrl(getHubWsBase(hubUrl))
    const connection = connectHubWebSocket(wsUrl, {
      onMessage: (payload) => {
        setLiveTelemetry(payload)
      },
      onStatus: (status, error) => {
        if (status === "connecting") {
          setWsStatus("connecting")
          setWsError(null)
        } else if (status === "open") {
          setWsStatus("open")
          setWsError(null)
        } else if (status === "error") {
          setWsStatus("error")
          setWsError(error ?? "WebSocket error")
        } else if (status === "closed") {
          setWsStatus("closed")
        }
      },
    })

    wsRef.current = connection

    return () => {
      connection.close()
      wsRef.current = null
    }
  }, [hubUrl])

  const value = useMemo(
    () => ({
      hubUrl,
      isHubConfigured,
      hubPromptDismissed,
      wsStatus,
      wsError,
      liveTelemetry,
      handleSaveHubUrl,
      clearHubUrl,
    }),
    [
      hubUrl,
      isHubConfigured,
      hubPromptDismissed,
      wsStatus,
      wsError,
      liveTelemetry,
      handleSaveHubUrl,
      clearHubUrl,
    ],
  )

  return <HubConfigContext.Provider value={value}>{children}</HubConfigContext.Provider>
}

export function useHubConfigContext() {
  const ctx = React.useContext(HubConfigContext)
  if (!ctx) {
    throw new Error("useHubConfigContext must be used inside HubConfigProvider")
  }
  return ctx
}
