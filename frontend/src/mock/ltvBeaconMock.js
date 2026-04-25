function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n))
}

function jitter(n, amount) {
  return n + (Math.random() - 0.5) * amount
}

const WIND_LABELS = [
  'North (N)',
  'North - East (NE)',
  'East (E)',
  'South - East (SE)',
  'South (S)',
  'South - West (SW)',
  'West (W)',
  'North - West (NW)',
]

/** 0–360°, clockwise from north */
function cardinalLabelFromBearing(deg) {
  const i = Math.floor(((deg % 360) + 360 + 22.5) / 45) % 8
  return WIND_LABELS[i]
}

const BAR_COUNT = 52

function seedSignalBars() {
  return Array.from({ length: BAR_COUNT }, () => clamp(0.25 + Math.random() * 0.55, 0.12, 0.95))
}

const INITIAL = {
  locateElapsedSeconds: 1366,
  currentMode: 'LOCATE',
  distanceNearM: 470,
  distanceFarM: 500,
  ltvLocationDetected: true,
  trackingBeaconId: 'LTV BEACON-07',
  centerLabel: 'Rover-2',
  directionRowSub: 'Bearing Radar',
  bearingDeg: 225,
  latSouthDeg: 48,
  latSouthMin: 52.6,
  lonWestDeg: 123,
  lonWestMin: 23.6,
  bottomDistanceM: 300,
  bottomGoalM: 500,
  envRiskIndex: 0.18,
  envRiskStable: true,
  feedRover1X: 0,
  feedRover1Y: 0,
  feedRover2X: 0,
  feedRover2Y: 0,
  feedMapNudge: 0,
  signalPct: 92,
  signalDbm: -58,
  latencySec: 0.45,
  signalBars: seedSignalBars(),
}

function formatHms(totalSec) {
  const t = Math.max(0, Math.floor(totalSec))
  const h = Math.floor(t / 3600)
  const m = Math.floor((t % 3600) / 60)
  const s = t % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatCoord(s) {
  return `${s.latSouthDeg}°${s.latSouthMin.toFixed(1)}′S, ${s.lonWestDeg}°${s.lonWestMin.toFixed(1)}′W`
}

export class LtvBeaconMock {
  constructor() {
    this.state = structuredClone(INITIAL)
    /** @type {Set<(s: ReturnType<LtvBeaconMock['getSnapshot']>) => void>} */
    this.listeners = new Set()
    this.timer = null
    this.intervalMs = 900
  }

  getSnapshot() {
    const s = this.state
    return {
      ...s,
      signalBars: [...s.signalBars],
      formattedDuration: formatHms(s.locateElapsedSeconds),
      formattedCoords: formatCoord(s),
      cardinalLabel: cardinalLabelFromBearing(s.bearingDeg),
      riskLabel: s.envRiskStable ? 'Stable' : 'Elevated',
    }
  }

  subscribe(listener) {
    this.listeners.add(listener)
    listener(this.getSnapshot())
    this.start()
    return () => {
      this.listeners.delete(listener)
      if (this.listeners.size === 0) this.stop()
    }
  }

  notify() {
    const snap = this.getSnapshot()
    this.listeners.forEach((fn) => fn(snap))
  }

  start() {
    if (this.timer) return
    this.timer = setInterval(() => this.tick(), this.intervalMs)
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  tick() {
    const s = this.state
    s.locateElapsedSeconds += 1

    s.distanceNearM = clamp(Math.round(jitter(s.distanceNearM, 6)), 380, 495)
    s.distanceFarM = clamp(Math.round(jitter(s.distanceFarM, 2)), 498, 520)

    s.bearingDeg = clamp(jitter(s.bearingDeg, 2.2), 0, 360)
    s.latSouthMin = clamp(jitter(s.latSouthMin, 0.08), 51.2, 54.1)
    s.lonWestMin = clamp(jitter(s.lonWestMin, 0.06), 22.1, 25.4)

    s.bottomDistanceM = clamp(Math.round(jitter(s.bottomDistanceM, 14)), 180, 420)
    s.bottomGoalM = clamp(Math.round(jitter(s.bottomGoalM, 4)), 480, 520)

    s.envRiskIndex = clamp(Math.round(jitter(s.envRiskIndex, 0.03) * 100) / 100, 0.08, 0.42)
    s.envRiskStable = s.envRiskIndex < 0.32

    s.feedRover1X = jitter(s.feedRover1X, 0.35)
    s.feedRover1Y = jitter(s.feedRover1Y, 0.28)
    s.feedRover2X = jitter(s.feedRover2X, 0.42)
    s.feedRover2Y = jitter(s.feedRover2Y, 0.31)
    s.feedMapNudge = Math.sin(s.locateElapsedSeconds * 0.08) * 0.4

    s.signalPct = clamp(Math.round(jitter(s.signalPct, 2.2)), 72, 99)
    s.signalDbm = clamp(Math.round(jitter(s.signalDbm, 1.4)), -72, -48)
    s.latencySec = clamp(Math.round(jitter(s.latencySec, 0.06) * 100) / 100, 0.28, 0.62)

    const bars = s.signalBars
    const last = clamp(bars[bars.length - 1] + (Math.random() - 0.45) * 0.12, 0.15, 0.98)
    s.signalBars = [...bars.slice(-(BAR_COUNT - 1)), last]

    this.notify()
  }
}

export const ltvBeaconMock = new LtvBeaconMock()
