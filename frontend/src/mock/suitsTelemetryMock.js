function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n))
}

function jitter(n, amount) {
  return n + (Math.random() - 0.5) * amount
}

/** @typedef {typeof INITIAL_SUITS} SuitsSnapshot */
/** @typedef {typeof INITIAL_CREW} CrewVitalsSnapshot */

const INITIAL_SUITS = {
  missionId: 'NASA - EVA -04',
  subsystem: 'PLSS',
  systemsBanner: 'SYSTEMS NOMINAL',
  systemsNominal: true,
  o2Psi: 4.3,
  o2Tank1Pct: 90,
  o2Tank2Pct: 90,
  o2RemainingMinutes: 216,
  co2MmHg: 0.4,
  scrubberEfficiencyPct: 90,
  co2Tank2Pct: 90,
  lcvgFlowLbHr: 240,
  lcvgFlowMaxLbHr: 280,
  /** Shown as FAN (PRI) / FAN (SEC) rpm in Iteration 4 LS layout */
  fanPriRpm: 15.2,
  fanSecRpm: 0,
  fwPressurePsi: 15.2,
  fwQuantityPct: 84,
  lcvgInletF: 52,
  lcvgReturnF: 80,
  deltaTCurrent: 15,
  deltaTMax: 20,
  tempSeriesInlet: [48, 49, 50, 51, 51.5, 52, 52, 51.8, 52, 52.1, 52, 52],
  tempSeriesReturn: [72, 74, 76, 77, 78, 79, 79.5, 80, 80, 79.8, 80, 80],
}

/** Second suit / EV column — Figma `7383:106095`; distinct starting telemetry */
const INITIAL_SUITS_2 = {
  ...INITIAL_SUITS,
  o2Psi: 3.85,
  o2Tank1Pct: 76,
  o2Tank2Pct: 93,
  o2RemainingMinutes: 188,
  co2MmHg: 0.52,
  scrubberEfficiencyPct: 84,
  co2Tank2Pct: 91,
  lcvgFlowLbHr: 198,
  lcvgFlowMaxLbHr: 280,
  fanPriRpm: 13.6,
  fanSecRpm: 1.4,
  fwPressurePsi: 14.4,
  fwQuantityPct: 71,
  lcvgInletF: 50,
  lcvgReturnF: 77,
  deltaTCurrent: 13,
  deltaTMax: 22,
  tempSeriesInlet: [47, 48, 49, 49.5, 50, 50.2, 50.5, 50.4, 50.6, 50.5, 50.4, 50.5],
  tempSeriesReturn: [70, 72, 74, 75, 76, 77, 77.5, 78, 78, 77.5, 77.8, 78],
}

const INITIAL_CREW = {
  heartRateBpm: 115,
  coreTempF: 98,
  respRate: 17,
  spo2: 97,
}

/** Crew 2 vitals — aligned with Figma `7383:106232` snapshot (HR / SpO₂ / temp / RR differ from suit 1) */
const INITIAL_CREW_2 = {
  heartRateBpm: 115,
  coreTempF: 97,
  respRate: 32,
  spo2: 97,
}

const CREW_HISTORY_LEN = 40

/**
 * @param {typeof INITIAL_CREW} base
 */
function seedCrewHistory(base) {
  return {
    heartRateBpm: Array.from({ length: CREW_HISTORY_LEN }, (_, i) =>
      clamp(base.heartRateBpm + Math.sin(i * 0.45) * 7, 92, 142),
    ),
    coreTempF: Array.from({ length: CREW_HISTORY_LEN }, (_, i) =>
      Math.round((base.coreTempF + Math.sin(i * 0.32) * 0.45) * 10) / 10,
    ),
    respRate: Array.from({ length: CREW_HISTORY_LEN }, (_, i) =>
      clamp(base.respRate + Math.sin(i * 0.38) * 2.5, 11, 36),
    ),
    spo2: Array.from({ length: CREW_HISTORY_LEN }, (_, i) =>
      clamp(base.spo2 + Math.sin(i * 0.25) * 2, 91, 100),
    ),
  }
}

function pushHistory(arr, value, maxLen) {
  return [...arr, value].slice(-maxLen)
}

function o2SegmentsFromPsi(psi) {
  return clamp(Math.round((psi / 4.2) * 15), 0, 15)
}

function co2SegmentsFromMmHg(mmHg) {
  return clamp(Math.round((mmHg / 1.2) * 15), 0, 15)
}

function flowNormalized(flow, max) {
  return clamp(flow / max, 0, 1)
}

/** @typedef {'suits1' | 'suits2'} SuitsTelemetrySlot */

function cloneSuitsTelemetryBucket(baseSuits, baseCrew, history) {
  return {
    suits: structuredClone(baseSuits),
    crewVitals: { ...baseCrew },
    crewHistory: {
      heartRateBpm: [...history.heartRateBpm],
      coreTempF: [...history.coreTempF],
      respRate: [...history.respRate],
      spo2: [...history.spo2],
    },
  }
}

function snapshotFromBucket(bucket) {
  const { suits, crewVitals, crewHistory } = bucket
  return {
    suits: {
      ...suits,
      tempSeriesInlet: [...suits.tempSeriesInlet],
      tempSeriesReturn: [...suits.tempSeriesReturn],
    },
    crewVitals: { ...crewVitals },
    crewHistory: {
      heartRateBpm: [...crewHistory.heartRateBpm],
      coreTempF: [...crewHistory.coreTempF],
      respRate: [...crewHistory.respRate],
      spo2: [...crewHistory.spo2],
    },
  }
}

/**
 * Temporary telemetry simulator: two independent PLSS + crew streams (`suits1` / `suits2`).
 * @typedef {{ suits: typeof INITIAL_SUITS, crewVitals: typeof INITIAL_CREW, crewHistory: ReturnType<typeof seedCrewHistory> }} SuitsTelemetrySlotSnapshot
 * @typedef {{ suits1: SuitsTelemetrySlotSnapshot, suits2: SuitsTelemetrySlotSnapshot }} SuitsTelemetryFullSnapshot
 */
export class SuitsTelemetryMock {
  constructor() {
    const h1 = seedCrewHistory(INITIAL_CREW)
    const h2 = seedCrewHistory(INITIAL_CREW_2)
    /** @type {{ suits1: ReturnType<typeof cloneSuitsTelemetryBucket>, suits2: ReturnType<typeof cloneSuitsTelemetryBucket> }} */
    this.state = {
      suits1: cloneSuitsTelemetryBucket(INITIAL_SUITS, INITIAL_CREW, h1),
      suits2: cloneSuitsTelemetryBucket(INITIAL_SUITS_2, INITIAL_CREW_2, h2),
    }
    /** @type {Set<(s: SuitsTelemetryFullSnapshot) => void>} */
    this.listeners = new Set()
    this.timer = null
    this.intervalMs = 1000
  }

  /** @returns {SuitsTelemetryFullSnapshot} */
  getSnapshot() {
    return {
      suits1: snapshotFromBucket(this.state.suits1),
      suits2: snapshotFromBucket(this.state.suits2),
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

  /**
   * @param {'suits1' | 'suits2'} slot
   */
  tickBucket(slot) {
    const b = this.state[slot]
    const s = b.suits
    const c = b.crewVitals
    const phase = slot === 'suits1' ? 0 : 1.7

    s.o2Psi = clamp(jitter(s.o2Psi, 0.22 + phase * 0.02), 3.35, 4.85)
    s.o2Tank1Pct = clamp(jitter(s.o2Tank1Pct, 5), 52, 100)
    s.o2Tank2Pct = clamp(jitter(s.o2Tank2Pct, 5), 52, 100)
    s.o2RemainingMinutes = clamp(Math.round(jitter(s.o2RemainingMinutes, 12)), 95, 320)

    s.co2MmHg = clamp(jitter(s.co2MmHg, 0.14), 0.12, 1.05)
    s.scrubberEfficiencyPct = clamp(jitter(s.scrubberEfficiencyPct, 4), 48, 100)
    s.co2Tank2Pct = clamp(jitter(s.co2Tank2Pct, 4), 48, 100)

    s.lcvgFlowLbHr = clamp(Math.round(jitter(s.lcvgFlowLbHr, 22)), 155, 278)
    s.fanPriRpm = clamp(jitter(s.fanPriRpm, 0.42), 12.4, 17.6)
    s.fanSecRpm = clamp(jitter(s.fanSecRpm, 0.08), 0, 2.2)
    s.fwPressurePsi = clamp(jitter(s.fwPressurePsi, 0.45), 13.2, 17.1)
    s.fwQuantityPct = clamp(jitter(s.fwQuantityPct, 3.5), 38, 100)

    s.lcvgInletF = clamp(jitter(s.lcvgInletF, 1.4), 45, 62)
    s.lcvgReturnF = clamp(jitter(s.lcvgReturnF, 1.6), 66, 92)
    s.deltaTCurrent = clamp(Math.round(jitter(s.deltaTCurrent, 2)), 7, 26)
    s.deltaTMax = clamp(Math.round(jitter(s.deltaTMax, 1.4)), 15, 30)

    const lastIn = s.tempSeriesInlet[s.tempSeriesInlet.length - 1] ?? s.lcvgInletF
    const lastOut = s.tempSeriesReturn[s.tempSeriesReturn.length - 1] ?? s.lcvgReturnF
    s.tempSeriesInlet = [...s.tempSeriesInlet.slice(-15), clamp(jitter(lastIn, 1.1 + phase * 0.05), 44, 62)]
    s.tempSeriesReturn = [...s.tempSeriesReturn.slice(-15), clamp(jitter(lastOut, 1.25 + phase * 0.05), 62, 94)]

    c.heartRateBpm = clamp(Math.round(jitter(c.heartRateBpm, 7)), 92, 142)
    c.coreTempF = clamp(Math.round(jitter(c.coreTempF, 0.45) * 10) / 10, 96.4, 99.8)
    c.respRate = clamp(Math.round(jitter(c.respRate, 2.2)), 11, 36)
    c.spo2 = clamp(Math.round(jitter(c.spo2, 1.2)), 91, 100)

    const h = b.crewHistory
    h.heartRateBpm = pushHistory(h.heartRateBpm, c.heartRateBpm, CREW_HISTORY_LEN)
    h.coreTempF = pushHistory(h.coreTempF, c.coreTempF, CREW_HISTORY_LEN)
    h.respRate = pushHistory(h.respRate, c.respRate, CREW_HISTORY_LEN)
    h.spo2 = pushHistory(h.spo2, c.spo2, CREW_HISTORY_LEN)
  }

  tick() {
    this.tickBucket('suits1')
    this.tickBucket('suits2')
    this.notify()
  }
}

export const suitsTelemetryMock = new SuitsTelemetryMock()

/** @param {{ suits: typeof INITIAL_SUITS, crewVitals: typeof INITIAL_CREW, crewHistory: ReturnType<typeof seedCrewHistory> }} snapshot */
export function getSuitsDerived(snapshot) {
  return {
    o2Segments: o2SegmentsFromPsi(snapshot.suits.o2Psi),
    co2Segments: co2SegmentsFromMmHg(snapshot.suits.co2MmHg),
    lcvgFlowNorm: flowNormalized(snapshot.suits.lcvgFlowLbHr, snapshot.suits.lcvgFlowMaxLbHr),
  }
}
