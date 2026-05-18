export const commsData = {
  tags: ["EV", "PR", "LTV", "EV low O2 levels", "LTV crash near POI 2"],
  entries: [
    { message: "Change path to go to POI 2 first", time: "00:12:10", badge: "PR" },
    { message: "Path Changed", time: "00:12:15" },
    { message: "Check my heart rate. I fell", time: "00:12:23", badge: "EV" },
    { message: "Updated Hazard Information", time: "00:12:34" },
    { message: "Sudden stop.", time: "00:12:42", badge: "LTV" },
    { message: "Initiated Repair Protocol.", time: "00:12:45" },
  ],
}

export const suitData = {
  id: "NASA - EVA -04",
  status: "PLSS",
  timestamp: "19:07:30",
  oxygenPsi: "4.3",
  oxygenTanks: [90, 90],
  co2: "0.4",
  scrubber: 90,
  co2Tank: 90,
  totalRemaining: "3hr 36min",
  flowRate: 240,
  fwPressure: "15.2 psi",
  fwQuantity: "84 %",
  lcvgInlet: "52 deg F",
  lcvgReturn: "80 deg F",
}

export const vitalLabels = [
  { label: "HR (Heart Rate)", unit: "bpm", tone: "amber" },
  { label: "SpO2", unit: "%", tone: "teal" },
  { label: "Core Body Temp", unit: "deg F", tone: "green" },
  { label: "Respiration Rate", unit: "Breaths/min", tone: "magenta" },
]

export const evData = {
  name: "Roger Williams",
  role: "Crew ID 1231231243",
  alert: "Elevated BPM for the past 15 Minutes",
  vitals: [
    { label: "HR (Heart Rate)", value: "115", unit: "bpm", trend: "up", tone: "amber" },
    { label: "SpO2", value: "97", unit: "%", trend: "stable", tone: "teal" },
    { label: "Core Body Temp", value: "98", unit: "deg F", trend: "up", tone: "green" },
    { label: "Respiration Rate", value: "32", unit: "Breaths/min", trend: "down", tone: "magenta" },
  ],
}

export const beaconData = {
  mode: "CURRENT MODE: LOCATE",
  duration: "00:22:46",
  locationStatus: "Detected",
  distanceToBeacon: "470 m / 500 m",
  direction: "South - West (SW)",
  bearing: "134 deg",
  coordinates: "48 deg 52.6 S, 123 deg 23.6 W",
  distanceProgress: 0.58,
  distanceDisplay: "300 m / 0 m",
  signalStrength: "92% (-58 dBm)",
  latency: "0.45 s",
}
