import { getSuitsDerived } from "../mock/suitsTelemetryMock"

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n))
}

function cToF(c) {
  return (c * 9) / 5 + 32
}

/** TSS sometimes reports fan RPM in raw units (e.g. 30000). */
export function normalizeFanRpm(rpm) {
  const n = Number(rpm) || 0
  if (n > 100) return n / 1000
  return n
}

function coolantPressureToPsi(pressure) {
  const p = Number(pressure) || 0
  if (p > 100) return clamp(p / 33, 0, 25)
  return clamp(p, 0, 25)
}

const WIND_LABELS = [
  "North (N)",
  "North - East (NE)",
  "East (E)",
  "South - East (SE)",
  "South (S)",
  "South - West (SW)",
  "West (W)",
  "North - West (NW)",
]

export function cardinalLabelFromBearing(deg) {
  const i = Math.floor(((deg % 360) + 360 + 22.5) / 45) % 8
  return WIND_LABELS[i]
}

export function distanceM(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1)
}

/** Bearing from (x1,y1) to (x2,y2), degrees clockwise from +Y (north on map). */
export function bearingDeg(x1, y1, x2, y2) {
  const dx = x2 - x1
  const dy = y2 - y1
  const rad = Math.atan2(dx, dy)
  return ((rad * 180) / Math.PI + 360) % 360
}

function pushHistory(arr, value, maxLen) {
  return [...arr, value].slice(-maxLen)
}

const CREW_HISTORY_LEN = 40
const TEMP_SERIES_LEN = 12
const SIGNAL_BAR_COUNT = 52

const EMPTY_CREW_HISTORY = {
  heartRateBpm: [],
  coreTempF: [],
  respRate: [],
  spo2: [],
}

/**
 * @param {Record<string, unknown>} raw Hub ev-telemetry JSON
 * @param {{ suits?: object, crewHistory?: typeof EMPTY_CREW_HISTORY }} prev
 */
export function mapEvTelemetryToSlot(raw, prev = {}) {
  const prevHistory = prev.crewHistory ?? EMPTY_CREW_HISTORY
  const prevSuits = prev.suits ?? {}
  const prevInlet = prevSuits.tempSeriesInlet ?? []
  const prevReturn = prevSuits.tempSeriesReturn ?? []

  const o2Pri = Number(raw.oxy_pri_storage) || 0
  const o2Sec = Number(raw.oxy_sec_storage) || 0
  const co2MmHg = Number(raw.suit_pressure_co2 ?? raw.helmet_pressure_co2) || 0
  const scrubA = Number(raw.scrubber_a_co2_storage) || 0
  const scrubB = Number(raw.scrubber_b_co2_storage) || 0
  const coreTempF = cToF(Number(raw.temperature) || 21)
  const heartRate = Math.round(Number(raw.heart_rate) || 0)
  const respRate =
    heartRate > 0
      ? clamp(Math.round(12 + (Number(raw.co2_production) || 0) * 8 + heartRate * 0.05), 11, 36)
      : Number(prev.crewVitals?.respRate) || 17
  const spo2 = clamp(
    Math.round(98 - co2MmHg * 2 + o2Pri * 0.02),
    91,
    100,
  )

  const lcvgInletF = coreTempF - 46
  const lcvgReturnF = coreTempF + (Number(prevSuits.deltaTCurrent) || 15)
  const inletSeries = pushHistory(prevInlet, lcvgInletF, TEMP_SERIES_LEN)
  const returnSeries = pushHistory(prevReturn, lcvgReturnF, TEMP_SERIES_LEN)

  const oxyTimeLeft = Number(raw.oxy_time_left) || Number(raw.batt_time_left) || 0
  const lcvgFlowLbHr =
    Number(raw.coolant_ml) > 0
      ? clamp(Number(raw.coolant_ml) * 2.4, 120, 280)
      : clamp(140 + (Number(raw.oxy_consumption) || 0) * 40, 120, 280)

  const systemsNominal = co2MmHg < 0.85 && o2Pri > 15 && o2Sec > 15

  const crewVitals = {
    heartRateBpm: heartRate || prev.crewVitals?.heartRateBpm || 0,
    coreTempF,
    respRate,
    spo2,
  }

  const crewHistory = {
    heartRateBpm: pushHistory(prevHistory.heartRateBpm, crewVitals.heartRateBpm, CREW_HISTORY_LEN),
    coreTempF: pushHistory(prevHistory.coreTempF, crewVitals.coreTempF, CREW_HISTORY_LEN),
    respRate: pushHistory(prevHistory.respRate, crewVitals.respRate, CREW_HISTORY_LEN),
    spo2: pushHistory(prevHistory.spo2, crewVitals.spo2, CREW_HISTORY_LEN),
  }

  const suits = {
    missionId: "NASA - EVA",
    subsystem: "PLSS",
    systemsBanner: systemsNominal ? "SYSTEMS NOMINAL" : "SYSTEMS OFF-NOMINAL",
    systemsNominal,
    o2Psi: Number(raw.suit_pressure_oxy) || 0,
    o2Tank1Pct: o2Pri,
    o2Tank2Pct: o2Sec,
    o2RemainingMinutes: oxyTimeLeft > 0 ? oxyTimeLeft : Math.round((o2Pri + o2Sec) * 1.2),
    co2MmHg,
    scrubberEfficiencyPct: scrubA,
    co2Tank2Pct: scrubB,
    lcvgFlowLbHr,
    lcvgFlowMaxLbHr: 280,
    fanPriRpm: normalizeFanRpm(raw.fan_pri_rpm),
    fanSecRpm: normalizeFanRpm(raw.fan_sec_rpm),
    fwPressurePsi: coolantPressureToPsi(raw.coolant_liquid_pressure),
    fwQuantityPct: Math.round((o2Pri + o2Sec) / 2),
    lcvgInletF,
    lcvgReturnF,
    deltaTCurrent: Math.round(lcvgReturnF - lcvgInletF),
    deltaTMax: 20,
    tempSeriesInlet: inletSeries,
    tempSeriesReturn: returnSeries,
  }

  const snapshot = { suits, crewVitals, crewHistory }
  return {
    ...snapshot,
    derived: getSuitsDerived(snapshot),
  }
}

function formatHms(totalSec) {
  const t = Math.max(0, Math.floor(totalSec))
  const h = Math.floor(t / 3600)
  const m = Math.floor((t % 3600) / 60)
  const s = t % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

function formatSiteCoords(x, y) {
  return `X ${x.toFixed(1)} m, Y ${y.toFixed(1)} m`
}

function signalPctFromStrength(strength) {
  const s = Number(strength) || 0
  if (s <= 1) return clamp(Math.round(s * 100), 0, 100)
  return clamp(Math.round(s), 0, 100)
}

/**
 * @param {object} ltv Hub /ltv JSON
 * @param {object} rover Hub /telemetry JSON
 * @param {{ signalBars?: number[], locateElapsedSeconds?: number }} prev
 */
export function mapLtvBeacon(ltv, rover, prev = {}) {
  const lx = Number(ltv?.location?.last_known_x) || 0
  const ly = Number(ltv?.location?.last_known_y) || 0
  const rx = Number(rover?.currentPosX) || 0
  const ry = Number(rover?.currentPosY) || 0

  const dist = distanceM(rx, ry, lx, ly)
  const bearing = bearingDeg(rx, ry, lx, ly)
  const signalPct = signalPctFromStrength(ltv?.signal?.strength)
  const signalNorm = signalPct / 100
  const prevBars = prev.signalBars ?? []
  const signalBars = [...prevBars.slice(-(SIGNAL_BAR_COUNT - 1)), clamp(signalNorm, 0.05, 1)]

  const elapsed = (prev.locateElapsedSeconds ?? 0) + 1
  const bottomGoalM = 500
  const bottomDistanceM = clamp(Math.round(dist), 0, bottomGoalM)

  return {
    locateElapsedSeconds: elapsed,
    currentMode: "LOCATE",
    distanceNearM: Math.round(dist),
    distanceFarM: Math.max(Math.round(dist) + 30, 500),
    ltvLocationDetected: Number.isFinite(lx) && Number.isFinite(ly),
    trackingBeaconId: "LTV BEACON",
    centerLabel: "Rover",
    directionRowSub: "Bearing Radar",
    bearingDeg: bearing,
    formattedCoords: formatSiteCoords(lx, ly),
    bottomDistanceM,
    bottomGoalM,
    envRiskIndex: clamp(0.12 + (100 - signalPct) * 0.003, 0.08, 0.45),
    envRiskStable: signalPct > 40,
    signalPct,
    signalDbm: clamp(-72 + Math.round((100 - signalPct) * 0.14), -85, -45),
    latencySec: clamp(0.35 + (100 - signalPct) * 0.004, 0.28, 1.2),
    signalBars,
    formattedDuration: formatHms(elapsed),
    cardinalLabel: cardinalLabelFromBearing(bearing),
    riskLabel: signalPct > 40 ? "Stable" : "Elevated",
  }
}
