import { useEffect, useRef, useState } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import rockYardImage from "../../../assets/map/rock-yard.png"
import addPlusIcon from "../../../assets/map/Add_Plus.svg"
import editIcon from "../../../assets/map/Edit.svg"
import navigationIcon from "../../../assets/map/Navigation.svg"
import removeMinusIcon from "../../../assets/map/Remove_Minus.svg"
import stackSimpleIcon from "../../../assets/map/StackSimple.svg"
import trashIcon from "../../../assets/map/Trash.png"
import evNavigationIcon from "../../../assets/map/EV_Navigation.svg"
import prNavigationIcon from "../../../assets/map/PR_Navigation.svg"
import mapCircleWarningIcon from "../../../assets/map/Map_Circle_Warning.svg"
import mapTriangleWarningIcon from "../../../assets/map/Map_Triangle_Warning.svg"
import aiaIcon from "../../../assets/map/AIA_Icon.svg"
import {
  hazardZones,
  mapPoiPoints,
  tssDustCoordinateRange,
  tssTelemetryPoints,
} from "../data/mapData"

const IMAGE_WEST = -170
const IMAGE_EAST = 170
const IMAGE_NORTH = 72.61764527496968
const IMAGE_SOUTH = -72.61764527496968

const IMAGE_COORDINATES = [
  [IMAGE_WEST, IMAGE_NORTH],
  [IMAGE_EAST, IMAGE_NORTH],
  [IMAGE_EAST, IMAGE_SOUTH],
  [IMAGE_WEST, IMAGE_SOUTH],
]

const IMAGE_BOUNDS = [
  [IMAGE_WEST, IMAGE_SOUTH],
  [IMAGE_EAST, IMAGE_NORTH],
]

const DRAG_ZOOM_BUFFER = 0.05
const BASE_MAP_OPTIONS = { padding: 0, pitch: 0, bearing: 0 }
const ZOOM_STEP = 1
const ZOOM_DURATION = 120
const RETURN_DURATION = 260
const GRID_COLUMNS = 30
const GRID_ROWS = 19
const SHARE_ICON_URL = "https://www.figma.com/api/mcp/asset/fbae0cb5-f112-446d-ab97-772406d27ee1"

function latToMercatorY(lat) {
  const rad = (lat * Math.PI) / 180
  return Math.log(Math.tan(Math.PI / 4 + rad / 2))
}

function mercatorYToLat(y) {
  return (Math.atan(Math.exp(y)) * 2 - Math.PI / 2) * (180 / Math.PI)
}

function pctToMapCoordinate(x, y) {
  const northY = latToMercatorY(IMAGE_NORTH)
  const southY = latToMercatorY(IMAGE_SOUTH)

  return [
    IMAGE_WEST + (x / 100) * (IMAGE_EAST - IMAGE_WEST),
    mercatorYToLat(northY + (y / 100) * (southY - northY)),
  ]
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}

function tssToMapCoordinate(x, y) {
  const xPct =
    ((x - tssDustCoordinateRange.xMin) / (tssDustCoordinateRange.xMax - tssDustCoordinateRange.xMin)) * 100
  const yPct =
    100 - ((y - tssDustCoordinateRange.yMin) / (tssDustCoordinateRange.yMax - tssDustCoordinateRange.yMin)) * 100
  return pctToMapCoordinate(Math.min(98, Math.max(2, xPct)), Math.min(98, Math.max(2, yPct)))
}

function zoneFeature(zone) {
  return {
    type: "Feature",
    properties: { level: zone.level },
    geometry: {
      type: "Polygon",
      coordinates: [[...zone.points.map(([x, y]) => pctToMapCoordinate(x, y)), pctToMapCoordinate(...zone.points[0])]],
    },
  }
}

function gridFeatures() {
  const features = []

  for (let i = 0; i <= GRID_COLUMNS; i += 1) {
    const x = (i / GRID_COLUMNS) * 100
    features.push({
      type: "Feature",
      properties: { major: i % 4 === 0 },
      geometry: {
        type: "LineString",
        coordinates: [pctToMapCoordinate(x, 0), pctToMapCoordinate(x, 100)],
      },
    })
  }

  for (let i = 0; i <= GRID_ROWS; i += 1) {
    const y = (i / GRID_ROWS) * 100
    features.push({
      type: "Feature",
      properties: { major: i % 5 === 0 },
      geometry: {
        type: "LineString",
        coordinates: [pctToMapCoordinate(0, y), pctToMapCoordinate(100, y)],
      },
    })
  }

  return features
}

function makePoiElement(poi) {
  const el = document.createElement("div")
  el.className = `map-poi-marker${poi.active ? " is-active" : ""}${poi.muted ? " is-muted" : ""}`
  el.innerHTML = `<span>${poi.type}</span><strong>${poi.label}</strong>`
  return el
}

function makePoiActionMenu() {
  const el = document.createElement("div")
  el.className = "map-poi-action-menu"
  el.innerHTML = `
    <button type="button" class="map-poi-action-menu__item">
      <img src="${editIcon}" alt="" aria-hidden="true" />
      <span>Edit</span>
    </button>
    <button type="button" class="map-poi-action-menu__item">
      <img src="${trashIcon}" alt="" aria-hidden="true" />
      <span>Delete</span>
    </button>
    <button type="button" class="map-poi-action-menu__item">
      <img src="${SHARE_ICON_URL}" alt="" aria-hidden="true" />
      <span>Share</span>
    </button>
  `
  return el
}

function makeTelemetryElement(point) {
  const el = document.createElement("div")
  el.className = `map-telemetry-marker map-telemetry-marker-${point.id}`
  el.style.setProperty("--heading", `${point.heading || 0}deg`)
  const markerIcon = point.id === "pr-place-indicator" ? prNavigationIcon : evNavigationIcon
  if (point.id === "pr-place-indicator") el.classList.add("map-telemetry-marker-pr")
  el.innerHTML = `<span>${point.label}</span><i><img src="${markerIcon}" alt="" aria-hidden="true" /></i>`
  return el
}

function makeZoneLabel(zone) {
  const cx = zone.points.reduce((sum, point) => sum + point[0], 0) / zone.points.length
  const cy = zone.points.reduce((sum, point) => sum + point[1], 0) / zone.points.length
  const el = document.createElement("div")
  el.className = `map-zone-label map-zone-label-${zone.level}`
  const warningIcon = zone.level === "danger" ? mapTriangleWarningIcon : mapCircleWarningIcon
  el.innerHTML = `<img src="${warningIcon}" alt="" aria-hidden="true" /><span>${zone.label}</span>`
  return { el, coordinate: pctToMapCoordinate(cx, cy) }
}

function displayTelemetryCoordinate(point) {
  if (point.id === "eva1") return pctToMapCoordinate(44, 53)
  if (point.id === "eva2") return pctToMapCoordinate(56, 58)
  if (point.id === "pr-place-indicator") return pctToMapCoordinate(50, 47)
  return tssToMapCoordinate(point.x, point.y)
}

function telemetryMarkerOffset(pointId) {
  if (pointId === "eva1") return [-8, -10]
  if (pointId === "eva2") return [8, 10]
  if (pointId === "pr-place-indicator") return [0, -6]
  return [0, 0]
}

export function MapStage({ poiPanel, addPoiPanel, addHazardPanel }) {
  const mapNode = useRef(null)
  const mapRef = useRef(null)
  const poiElementRefs = useRef(new Map())
  const poiMarkerRefs = useRef(new Map())
  const poiActionMarkerRef = useRef(null)
  const selectedPoiIdRef = useRef(null)
  const baseZoomRef = useRef(null)
  const baseCameraRef = useRef(null)
  const is3dRef = useRef(false)
  const isReturningRef = useRef(false)
  const [is3d, setIs3d] = useState(false)

  useEffect(() => {
    if (!mapNode.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: mapNode.current,
      attributionControl: false,
      style: {
        version: 8,
        sources: {
          "rock-yard": {
            type: "image",
            url: rockYardImage,
            coordinates: IMAGE_COORDINATES,
          },
        },
        layers: [
          {
            id: "background",
            type: "background",
            paint: { "background-color": "#06101f" },
          },
          {
            id: "rock-yard",
            type: "raster",
            source: "rock-yard",
            paint: {
              "raster-saturation": -1,
              "raster-contrast": 0.22,
              "raster-brightness-min": 0.08,
              "raster-brightness-max": 0.68,
            },
          },
        ],
      },
      center: [0, 0],
      zoom: 1.2,
      minZoom: 0.5,
      maxZoom: 5,
      renderWorldCopies: false,
      bearing: 0,
      pitch: 0,
      dragRotate: true,
      boxZoom: false,
    })

    function hidePoiActionMenu() {
      const selectedPoiElement = poiElementRefs.current.get(selectedPoiIdRef.current)
      selectedPoiElement?.classList.remove("is-selected")
      poiActionMarkerRef.current?.remove()
      poiActionMarkerRef.current = null
      selectedPoiIdRef.current = null
    }

    function deletePoiMarker(poiId) {
      const poiMarker = poiMarkerRefs.current.get(poiId)
      poiMarker?.remove()
      poiMarkerRefs.current.delete(poiId)
      hidePoiActionMenu()
    }

    function showPoiActionMenu(poi) {
      hidePoiActionMenu()
      const selectedPoiElement = poiElementRefs.current.get(poi.id)
      selectedPoiElement?.classList.add("is-selected")
      const menu = makePoiActionMenu()
      menu.addEventListener("click", (event) => event.stopPropagation())
      const deleteButton = menu.querySelectorAll(".map-poi-action-menu__item")[1]
      deleteButton?.addEventListener("click", () => deletePoiMarker(poi.id))
      poiActionMarkerRef.current = new maplibregl.Marker({
        element: menu,
        anchor: "bottom",
        offset: [0, -34],
      })
        .setLngLat(pctToMapCoordinate(poi.x, poi.y))
        .addTo(map)
      selectedPoiIdRef.current = poi.id
    }

    function dragAllowed() {
      return (
        !isReturningRef.current &&
        baseZoomRef.current !== null &&
        map.getZoom() > baseZoomRef.current + DRAG_ZOOM_BUFFER
      )
    }

    function syncDragPan() {
      if (dragAllowed()) {
        map.dragPan.enable()
      } else {
        map.dragPan.disable()
      }
    }

    function fullViewIsOff() {
      if (isReturningRef.current) return false
      if (baseZoomRef.current === null) return false

      const center = map.getCenter()
      return (
        Math.abs(map.getZoom() - baseZoomRef.current) > 0.01 ||
        Math.abs(center.lng) > 0.01 ||
        Math.abs(center.lat) > 0.01
      )
    }

    function containView() {
      if (isReturningRef.current) return
      if (!dragAllowed()) return

      const bounds = map.getBounds()
      const center = map.getCenter()
      const lngSpan = bounds.getEast() - bounds.getWest()
      const latSpan = bounds.getNorth() - bounds.getSouth()
      const minLng = IMAGE_BOUNDS[0][0] + lngSpan / 2
      const maxLng = IMAGE_BOUNDS[1][0] - lngSpan / 2
      const minLat = IMAGE_BOUNDS[0][1] + latSpan / 2
      const maxLat = IMAGE_BOUNDS[1][1] - latSpan / 2

      const nextLng = minLng <= maxLng ? clamp(center.lng, minLng, maxLng) : 0
      const nextLat = minLat <= maxLat ? clamp(center.lat, minLat, maxLat) : 0

      if (Math.abs(nextLng - center.lng) > 0.0001 || Math.abs(nextLat - center.lat) > 0.0001) {
        map.jumpTo({ center: [nextLng, nextLat] })
      }
    }

    function fitFullImage(duration = 0) {
      map.resize()
      map.setMinZoom(0)
      map.fitBounds(IMAGE_BOUNDS, { ...BASE_MAP_OPTIONS, duration })
      baseZoomRef.current = map.getZoom()
      baseCameraRef.current = {
        center: map.getCenter(),
        zoom: map.getZoom(),
      }
      map.setMinZoom(baseZoomRef.current)
      syncDragPan()
    }

    mapRef.current = map
    fitFullImage()
    map.scrollZoom.disable()
    map.doubleClickZoom.disable()
    map.on("zoomend", () => {
      if (isReturningRef.current) return
      syncDragPan()
      if (baseZoomRef.current !== null && map.getZoom() <= baseZoomRef.current + 0.005) {
        if (fullViewIsOff()) {
          fitFullImage()
        }
        return
      }
      containView()
    })
    map.on("move", containView)
    map.on("moveend", containView)
    map.on("click", hidePoiActionMenu)
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true, showZoom: true }), "top-right")

    const resizeObserver = new ResizeObserver(() => {
      if (isReturningRef.current) return
      if (!dragAllowed()) fitFullImage()
      else map.resize()
    })
    resizeObserver.observe(mapNode.current)

    map.once("load", () => {
      map.addSource("map-grid", {
        type: "geojson",
        data: { type: "FeatureCollection", features: gridFeatures() },
      })
      map.addSource("hazard-zones", {
        type: "geojson",
        data: { type: "FeatureCollection", features: hazardZones.map(zoneFeature) },
      })

      map.addLayer({
        id: "map-grid-minor",
        type: "line",
        source: "map-grid",
        filter: ["==", ["get", "major"], false],
        paint: {
          "line-color": "rgba(185, 204, 232, 0.34)",
          "line-width": ["interpolate", ["linear"], ["zoom"], 0, 0.7, 3, 1.1, 5, 1.5],
        },
      })
      map.addLayer({
        id: "map-grid-major",
        type: "line",
        source: "map-grid",
        filter: ["==", ["get", "major"], true],
        paint: {
          "line-color": "rgba(210, 225, 246, 0.52)",
          "line-width": ["interpolate", ["linear"], ["zoom"], 0, 1.1, 3, 1.6, 5, 2.1],
        },
      })

      map.addLayer({
        id: "hazard-fill",
        type: "fill",
        source: "hazard-zones",
        paint: {
          "fill-color": ["match", ["get", "level"], "danger", "#b41128", "warning", "#d99811", "#d99811"],
          "fill-opacity": ["match", ["get", "level"], "danger", 0.56, "warning", 0.64, 0.5],
        },
      })
      map.addLayer({
        id: "hazard-outline",
        type: "line",
        source: "hazard-zones",
        paint: {
          "line-color": ["match", ["get", "level"], "danger", "#ff3459", "warning", "#ffb11c", "#ffb11c"],
          "line-width": 2,
          "line-dasharray": [2, 1.2],
        },
      })

      mapPoiPoints.forEach((poi) => {
        const poiElement = makePoiElement(poi)
        poiElementRefs.current.set(poi.id, poiElement)
        poiElement.addEventListener("click", (event) => {
          event.stopPropagation()
          if (selectedPoiIdRef.current === poi.id) {
            hidePoiActionMenu()
            return
          }
          showPoiActionMenu(poi)
        })

        const poiMarker = new maplibregl.Marker({ element: poiElement, anchor: "bottom" })
          .setLngLat(pctToMapCoordinate(poi.x, poi.y))
          .addTo(map)
        poiMarkerRefs.current.set(poi.id, poiMarker)
      })

      hazardZones.forEach((zone) => {
        const { el, coordinate } = makeZoneLabel(zone)
        new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat(coordinate).addTo(map)
      })

      tssTelemetryPoints.filter((point) => point.id !== "ltv").forEach((point) => {
        new maplibregl.Marker({
          element: makeTelemetryElement(point),
          anchor: "bottom",
          offset: telemetryMarkerOffset(point.id),
        })
          .setLngLat(displayTelemetryCoordinate(point))
          .addTo(map)
      })
    })

    return () => {
      hidePoiActionMenu()
      poiElementRefs.current.clear()
      poiMarkerRefs.current.clear()
      resizeObserver.disconnect()
      map.remove()
      mapRef.current = null
    }
  }, [])

  function resetMap() {
    is3dRef.current = false
    setIs3d(false)
    mapRef.current?.setMinZoom(0)
    mapRef.current?.fitBounds(IMAGE_BOUNDS, { ...BASE_MAP_OPTIONS, duration: 0 })
    if (mapRef.current) {
      baseZoomRef.current = mapRef.current.getZoom()
      baseCameraRef.current = {
        center: mapRef.current.getCenter(),
        zoom: mapRef.current.getZoom(),
      }
      mapRef.current.setMinZoom(baseZoomRef.current)
    }
    mapRef.current?.dragPan.disable()
  }

  function resetFlatView() {
    is3dRef.current = false
    setIs3d(false)
    mapRef.current?.setMinZoom(0)
    mapRef.current?.fitBounds(IMAGE_BOUNDS, { ...BASE_MAP_OPTIONS, duration: 0 })
    if (mapRef.current) {
      baseZoomRef.current = mapRef.current.getZoom()
      baseCameraRef.current = {
        center: mapRef.current.getCenter(),
        zoom: mapRef.current.getZoom(),
      }
      mapRef.current.setMinZoom(baseZoomRef.current)
    }
    mapRef.current?.dragPan.disable()
  }

  function zoomOut() {
    const map = mapRef.current
    const baseCamera = baseCameraRef.current
    if (!map || !baseCamera || baseZoomRef.current === null) return

    is3dRef.current = false
    isReturningRef.current = true
    setIs3d(false)
    map.stop()
    map.setMinZoom(0)
    map.easeTo({
      center: baseCamera.center,
      zoom: baseCamera.zoom,
      ...BASE_MAP_OPTIONS,
      duration: RETURN_DURATION,
    })
    let returnFinished = false
    const finishReturn = () => {
      if (returnFinished) return
      returnFinished = true
      isReturningRef.current = false
      if (baseZoomRef.current !== null) map.setMinZoom(baseZoomRef.current)
      map.dragPan.disable()
    }
    map.once("moveend", finishReturn)
    window.setTimeout(finishReturn, RETURN_DURATION + 80)
  }

  function zoomIn() {
    const map = mapRef.current
    if (!map) return

    isReturningRef.current = false
    map.stop()
    map.easeTo({
      zoom: Math.min(map.getMaxZoom(), map.getZoom() + ZOOM_STEP),
      duration: ZOOM_DURATION,
    })
    if (baseZoomRef.current !== null && map.getZoom() + ZOOM_STEP > baseZoomRef.current + DRAG_ZOOM_BUFFER) {
      map.dragPan.enable()
    }
  }

  function toggle3d() {
    const next = !is3d
    is3dRef.current = next
    setIs3d(next)
    mapRef.current?.easeTo({ pitch: next ? 45 : 0, bearing: next ? -18 : 0, duration: 450 })
  }

  return (
    <section className="map-stage">
      <div ref={mapNode} className="maplibre-stage" aria-label="Interactive TSS DUST rock yard map" />
      <div className="map-grid-overlay" aria-hidden="true" />
      <div className="map-mode-control" aria-label="Map mode">
        <button type="button" className={is3d ? "is-enabled" : ""} onClick={toggle3d}>
          <span className="map-mode-toggle" aria-hidden="true">
            <span className="map-mode-toggle-handle" />
          </span>
          <span className="map-mode-label">3D</span>
        </button>
      </div>
      <div className="map-quick-tools" aria-label="Map tools">
        <button type="button" className="map-tool-button-nav" onClick={resetMap} aria-label="Recenter map">
          <img src={navigationIcon} alt="" aria-hidden="true" />
        </button>
        <button type="button" onClick={zoomIn} aria-label="Zoom in">
          <img src={addPlusIcon} alt="" aria-hidden="true" />
        </button>
        <button type="button" onClick={zoomOut} aria-label="Zoom out">
          <img src={removeMinusIcon} alt="" aria-hidden="true" />
        </button>
        <button type="button" onClick={resetFlatView} aria-label="Reset bearing and pitch">
          <img src={stackSimpleIcon} alt="" aria-hidden="true" />
        </button>
      </div>
      <img src={aiaIcon} alt="" aria-hidden="true" className="map-aia-icon" />
      {poiPanel}
      {addPoiPanel}
      {addHazardPanel}
    </section>
  )
}
