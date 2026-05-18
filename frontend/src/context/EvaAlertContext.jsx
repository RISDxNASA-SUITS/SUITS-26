import { createContext, useContext } from "react"
import { useEvaAlerts } from "../hooks/useEvaAlerts"

const EvaAlertContext = createContext(null)

export function EvaAlertProvider({ children, voiceAlerts = true }) {
  const value = useEvaAlerts({ voiceAlerts })
  return <EvaAlertContext.Provider value={value}>{children}</EvaAlertContext.Provider>
}

export function useEvaAlertContext() {
  const ctx = useContext(EvaAlertContext)
  if (!ctx) {
    throw new Error("useEvaAlertContext must be used within EvaAlertProvider")
  }
  return ctx
}
