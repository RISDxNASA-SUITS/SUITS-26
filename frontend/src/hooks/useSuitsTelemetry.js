import { useState, useEffect } from "react"
import { suitsTelemetryMock, getSuitsDerived } from "../mock/suitsTelemetryMock"

/**
 * Subscribe to live suit telemetry for a given slot.
 * Swap the import above to a backend data source when ready — components are unaffected.
 *
 * @param {'suits1' | 'suits2'} slot
 */
export function useSuitsTelemetry(slot = "suits1") {
  const [snap, setSnap] = useState(() => suitsTelemetryMock.getSnapshot())

  useEffect(() => suitsTelemetryMock.subscribe(setSnap), [])

  const slotSnap = snap[slot]
  return {
    suits: slotSnap.suits,
    crewVitals: slotSnap.crewVitals,
    crewHistory: slotSnap.crewHistory,
    derived: getSuitsDerived(slotSnap),
  }
}
