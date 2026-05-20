import { tssDustCoordinateRange } from "../data/mapData"

const IMAGE_WEST = -170
const IMAGE_EAST = 170
const IMAGE_NORTH = 72.61764527496968
const IMAGE_SOUTH = -72.61764527496968

function latToMercatorY(lat) {
  const rad = (lat * Math.PI) / 180
  return Math.log(Math.tan(Math.PI / 4 + rad / 2))
}

function mercatorYToLat(y) {
  return (Math.atan(Math.exp(y)) * 2 - Math.PI / 2) * (180 / Math.PI)
}

export function pctToMapCoordinate(x, y) {
  const northY = latToMercatorY(IMAGE_NORTH)
  const southY = latToMercatorY(IMAGE_SOUTH)
  return [
    IMAGE_WEST + (x / 100) * (IMAGE_EAST - IMAGE_WEST),
    mercatorYToLat(northY + (y / 100) * (southY - northY)),
  ]
}

/** Map TSS world coordinates (meters) to MapLibre [lng, lat]. */
export function tssToMapCoordinate(x, y) {
  const { xMin, xMax, yMin, yMax } = tssDustCoordinateRange
  const xPct = ((x - xMin) / (xMax - xMin)) * 100
  const yPct = 100 - ((y - yMin) / (yMax - yMin)) * 100
  return pctToMapCoordinate(
    Math.min(98, Math.max(2, xPct)),
    Math.min(98, Math.max(2, yPct)),
  )
}

/** Map MapLibre [lng, lat] to TSS world coordinates (meters). */
export function mapCoordinateToTss(lng, lat) {
  const { xMin, xMax, yMin, yMax } = tssDustCoordinateRange
  const xPct = ((lng - IMAGE_WEST) / (IMAGE_EAST - IMAGE_WEST)) * 100
  const northY = latToMercatorY(IMAGE_NORTH)
  const southY = latToMercatorY(IMAGE_SOUTH)
  const mercY = latToMercatorY(lat)
  const yPct = ((mercY - northY) / (southY - northY)) * 100
  const x = xMin + (xPct / 100) * (xMax - xMin)
  const y = yMin + ((100 - yPct) / 100) * (yMax - yMin)
  return { x, y }
}

export function formatTssCoords(x, y) {
  return `${x.toFixed(1)}, ${y.toFixed(1)}`
}
