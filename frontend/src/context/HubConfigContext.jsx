import React, { createContext, useState, useCallback } from "react"
import { getHubUrl, setHubUrl as saveHubUrl } from "../api/hubConfig"

export const HubConfigContext = createContext()

export function HubConfigProvider({ children }) {
  const [hubPromptDismissed, setHubPromptDismissed] = useState(false)

  const handleSaveHubUrl = useCallback((hubUrl) => {
    saveHubUrl(hubUrl)
    setHubPromptDismissed(true)
  }, [])

  return (
    <HubConfigContext.Provider value={{ hubPromptDismissed, handleSaveHubUrl }}>
      {children}
    </HubConfigContext.Provider>
  )
}

export function useHubConfigContext() {
  const ctx = React.useContext(HubConfigContext)
  if (!ctx) {
    throw new Error("useHubConfigContext must be used inside HubConfigProvider")
  }
  return ctx
}
