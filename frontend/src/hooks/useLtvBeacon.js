import { useState, useEffect } from "react"
import { ltvBeaconMock } from "../mock/ltvBeaconMock"

/**
 * Subscribe to live LTV beacon telemetry.
 * Swap the import to a backend data source when ready — components are unaffected.
 */
export function useLtvBeacon() {
  const [snap, setSnap] = useState(() => ltvBeaconMock.getSnapshot())
  useEffect(() => ltvBeaconMock.subscribe(setSnap), [])
  return snap
}
