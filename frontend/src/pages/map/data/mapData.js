export const yLabels = ["T", "S", "R", "Q", "P", "O", "N", "M", "L", "K", "J", "I", "H", "G", "F", "E", "D", "C", "B", "A"]
export const xLabels = Array.from({ length: 28 }, (_, i) => i)

export const topTrail = [
  { x: "30%", y: "36%" },
  { x: "36%", y: "29%" },
  { x: "39%", y: "29.5%" },
  { x: "47%", y: "27%" },
  { x: "57%", y: "21.5%" },
  { x: "63.5%", y: "26.5%" },
  { x: "70%", y: "32%" },
]

export const lowerTrail = [
  { x: "36%", y: "55%" },
  { x: "34%", y: "64%" },
  { x: "31%", y: "72%" },
  { x: "40%", y: "76%" },
  { x: "52%", y: "72%" },
  { x: "58%", y: "84%" },
  { x: "64%", y: "85%" },
]

export const floatingPoi = [
  { x: "31%", y: "32%" },
  { x: "39%", y: "24%" },
  { x: "45%", y: "24.5%" },
  { x: "53%", y: "22%" },
  { x: "61.5%", y: "16%" },
  { x: "68%", y: "21.5%" },
  { x: "73%", y: "35%" },
  { x: "88%", y: "48%" },
  { x: "84%", y: "62%" },
  { x: "91%", y: "72%" },
  { x: "57%", y: "84%" },
  { x: "40.5%", y: "72%" },
]

export const tssDustCoordinateRange = {
  xMin: -6550,
  xMax: -5450,
  yMin: -10450,
  yMax: -9750,
}

export const tssRockYardCoordinateRange = {
  xMin: -5765,
  xMax: -5545,
  yMin: -10075,
  yMax: -9940,
}

export const tssTelemetryPoints = [
  { id: "eva1", label: "EV1", x: -6762.068359, y: -10814.757812, heading: 352.071533 },
  { id: "eva2", label: "EV2", x: -6804.300781, y: -10868.552734, heading: 0 },
  { id: "pr-place-indicator", label: "PR", x: -6783.18457, y: -10841.655273, heading: 18 },
  { id: "ltv", label: "LTV last known", x: -5839.3, y: -10460.6, heading: 0 },
]

export const mapPoiPoints = [
  { id: "poi-7-west", label: "POI 7", type: "PR", x: 6.8, y: 37.8 },
  { id: "poi-6-west", label: "POI 6", type: "PR", x: 11.6, y: 57.8 },
  { id: "poi-4-west", label: "POI 4", type: "PR", x: 28.2, y: 89.2, muted: true },
  { id: "poi-5-center", label: "POI 5", type: "PR", x: 36.0, y: 40.6, active: true },
  { id: "poi-6-center", label: "POI 6", type: "PR", x: 41.8, y: 34.3 },
  { id: "poi-7-center", label: "POI 07", type: "PR", x: 47.0, y: 37.2 },
  { id: "poi-8", label: "POI 8", type: "PR", x: 53.0, y: 31.6 },
  { id: "poi-9", label: "POI 9", type: "PR", x: 62.2, y: 26.7 },
  { id: "poi-10", label: "POI 10", type: "PR", x: 70.0, y: 31.8 },
  { id: "poi-11", label: "POI 11", type: "PR", x: 74.5, y: 37.5 },
  { id: "poi-3-east", label: "POI 3", type: "PR", x: 89.6, y: 40.4, active: true },
  { id: "poi-1-east", label: "POI 1", type: "PR", x: 88.6, y: 78.5, muted: true },
  { id: "poi-2-south", label: "POI 2", type: "PR", x: 46.8, y: 71.8, muted: true },
  { id: "poi-4-south", label: "POI 4", type: "PR", x: 41.2, y: 61.0, muted: true },
]

export const mapRoutes = [
  {
    id: "eva2-route",
    mode: "solid",
    color: "#c8d0da",
    points: [
      [10.2, 69.0],
      [15.5, 73.5],
      [24.2, 76.2],
      [28.4, 89.2],
    ],
  },
  {
    id: "eva1-route",
    mode: "solid",
    color: "#c8d0da",
    points: [
      [88.6, 78.5],
      [92.1, 62.5],
      [81.8, 51.6],
    ],
  },
  {
    id: "pr-route",
    mode: "dotted",
    color: "#f5f7fb",
    points: [
      [41.8, 34.3],
      [47.0, 37.2],
      [53.0, 31.6],
      [62.2, 26.7],
      [70.0, 31.8],
      [74.5, 37.5],
    ],
  },
  {
    id: "active-west",
    mode: "active",
    color: "#1684ff",
    points: [
      [11.6, 57.8],
      [10.0, 69.0],
    ],
  },
  {
    id: "active-center",
    mode: "active",
    color: "#1684ff",
    points: [
      [36.0, 40.6],
      [37.5, 48.5],
    ],
  },
  {
    id: "active-east",
    mode: "active",
    color: "#1684ff",
    points: [
      [89.6, 40.4],
      [82.3, 51.6],
    ],
  },
]

export const hazardZones = [
  {
    id: "shadow-zone",
    label: "DARK REGION",
    level: "warning",
    points: [
      [52.6, 38.0],
      [66.7, 39.2],
      [70.0, 53.0],
      [64.8, 59.3],
      [54.8, 54.0],
    ],
  },
  {
    id: "restricted-zone",
    label: "DARK REGION",
    level: "danger",
    points: [
      [68.5, 67.2],
      [76.6, 67.2],
      [81.6, 84.0],
      [81.6, 100],
      [62.5, 100],
    ],
  },
]
