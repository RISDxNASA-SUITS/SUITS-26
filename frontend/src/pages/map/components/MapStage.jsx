import { useCallback, useEffect, useRef, useState } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import dustMapImage from "../../../assets/map/dust-map_cpopped.png"
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
import { hazardZones } from "../data/mapData"
import { tssToMapCoordinate } from "../utils/coordinates"

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

function makePoiActionMenu(poi, { onDelete, onNavigate }) {
  const el = document.createElement("div")
  el.className = "map-poi-action-menu"
  el.innerHTML = `
    <button type="button" class="map-poi-action-menu__item" data-action="navigate">
      <img src="${navigationIcon}" alt="" aria-hidden="true" />
      <span>Navigate</span>
    </button>
    <button type="button" class="map-poi-action-menu__item" data-action="edit">
      <img src="${editIcon}" alt="" aria-hidden="true" />
      <span>Edit</span>
    </button>
    <button type="button" class="map-poi-action-menu__item" data-action="delete">
      <img src="${trashIcon}" alt="" aria-hidden="true" />
      <span>Delete</span>
    </button>
    <button type="button" class="map-poi-action-menu__item" data-action="share">
      <img src="${SHARE_ICON_URL}" alt="" aria-hidden="true" />
      <span>Share</span>
    </button>
  `
  el.querySelector('[data-action="navigate"]')?.addEventListener("click", (e) => {
    e.stopPropagation()
    onNavigate?.(poi)
  })
  el.querySelector('[data-action="delete"]')?.addEventListener("click", (e) => {
    e.stopPropagation()
    onDelete?.(poi)
  })
  return el
}

function makeTelemetryElement(point) {
  const el = document.createElement("div")
  el.className = `map-telemetry-marker map-telemetry-marker-${point.id}`
  el.style.setProperty("--heading", `${point.heading || 0}deg`)
  const markerIcon = point.id === "pr" ? prNavigationIcon : evNavigationIcon
  if (point.id === "pr") el.classList.add("map-telemetry-marker-pr")
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

function telemetryMarkerOffset(pointId) {
  if (pointId === "eva1") return [-8, -10]
  if (pointId === "eva2") return [8, 10]
  if (pointId === "pr") return [0, -6]
  return [0, 0]
}

export function MapStage({
  pois = [],
  telemetryPoints = [],
  onDeletePoi,
  onNavigateToPoi,
  poiPanel,
  addPoiPanel,
  addHazardPanel,
}) {
  const mapNode = useRef(null)
  const mapRef = useRef(null)
  const mapReadyRef = useRef(false)
  const poiElementRefs = useRef(new Map())
  const poiMarkerRefs = useRef(new Map())
  const telemetryMarkerRefs = useRef(new Map())
  const poiActionMarkerRef = useRef(null)
  const selectedPoiIdRef = useRef(null)
  const hidePoiActionMenuRef = useRef(() => {})
  const baseZoomRef = useRef(null)
  const baseCameraRef = useRef(null)
  const is3dRef = useRef(false)
  const isReturningRef = useRef(false)
  const onDeletePoiRef = useRef(onDeletePoi)
  const onNavigateToPoiRef = useRef(onNavigateToPoi)
  const [is3d, setIs3d] = useState(false)

  onDeletePoiRef.current = onDeletePoi
  onNavigateToPoiRef.current = onNavigateToPoi

  const syncPoiMarkers = useCallback((map, poiList) => {
    const nextIds = new Set(poiList.map((p) => p.id))

    for (const [id, marker] of poiMarkerRefs.current.entries()) {
      if (!nextIds.has(id)) {
        marker.remove()
        poiMarkerRefs.current.delete(id)
        poiElementRefs.current.delete(id)
      }
    }

    poiList.forEach((poi) => {
      const lngLat = tssToMapCoordinate(poi.tssX, poi.tssY)
      const existing = poiMarkerRefs.current.get(poi.id)
      if (existing) {
        existing.setLngLat(lngLat)
        const el = poiElementRefs.current.get(poi.id)
        if (el) {
          el.className = `map-poi-marker${poi.active ? " is-active" : ""}${poi.muted ? " is-muted" : ""}`
          el.innerHTML = `<span>${poi.type}</span><strong>${poi.label}</strong>`
        }
        return
      }

      const poiElement = makePoiElement(poi)
      poiElementRefs.current.set(poi.id, poiElement)
      poiElement.addEventListener("click", (event) => {
        event.stopPropagation()
        if (selectedPoiIdRef.current === poi.id) {
          hidePoiActionMenuRef.current()
          return
        }
        hidePoiActionMenuRef.current()
        const selectedPoiElement = poiElementRefs.current.get(poi.id)
        selectedPoiElement?.classList.add("is-selected")
        const menu = makePoiActionMenu(poi, {
          onDelete: (p) => onDeletePoiRef.current?.(p),
          onNavigate: (p) => onNavigateToPoiRef.current?.(p),
        })
        menu.addEventListener("click", (e) => e.stopPropagation())
        poiActionMarkerRef.current = new maplibregl.Marker({
          element: menu,
          anchor: "bottom",
          offset: [0, -34],
        })
          .setLngLat(lngLat)
          .addTo(map)
        selectedPoiIdRef.current = poi.id
      })

      const poiMarker = new maplibregl.Marker({ element: poiElement, anchor: "bottom" })
        .setLngLat(lngLat)
        .addTo(map)
      poiMarkerRefs.current.set(poi.id, poiMarker)
    })
  }, [])

  const syncTelemetryMarkers = useCallback((map, points) => {
    const nextIds = new Set(points.map((p) => p.id))

    for (const [id, marker] of telemetryMarkerRefs.current.entries()) {
      if (!nextIds.has(id)) {
        marker.remove()
        telemetryMarkerRefs.current.delete(id)
      }
    }

    points.forEach((point) => {
      const lngLat = tssToMapCoordinate(point.x, point.y)
      const existing = telemetryMarkerRefs.current.get(point.id)
      if (existing) {
        existing.setLngLat(lngLat)
        const el = existing.getElement()
        if (el) {
          el.style.setProperty("--heading", `${point.heading || 0}deg`)
        }
        return
      }

      const marker = new maplibregl.Marker({
        element: makeTelemetryElement(point),
        anchor: "bottom",
        offset: telemetryMarkerOffset(point.id),
      })
        .setLngLat(lngLat)
        .addTo(map)
      telemetryMarkerRefs.current.set(point.id, marker)
    })
  }, [])

  useEffect(() => {
    if (!mapNode.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: mapNode.current,
      attributionControl: false,
      style: {
        version: 8,
        sources: {
          "dust-map": {
            type: "image",
            url: dustMapImage,
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
            id: "dust-map",
            type: "raster",
            source: "dust-map",
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
    hidePoiActionMenuRef.current = hidePoiActionMenu

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

      hazardZones.forEach((zone) => {
        const { el, coordinate } = makeZoneLabel(zone)
        new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat(coordinate).addTo(map)
      })

      mapReadyRef.current = true
      syncPoiMarkers(map, pois)
      syncTelemetryMarkers(map, telemetryPoints)
    })

    return () => {
      hidePoiActionMenu()
      poiElementRefs.current.clear()
      poiMarkerRefs.current.clear()
      telemetryMarkerRefs.current.forEach((m) => m.remove())
      telemetryMarkerRefs.current.clear()
      mapReadyRef.current = false
      resizeObserver.disconnect()
      map.remove()
      mapRef.current = null
    }
  }, [syncPoiMarkers, syncTelemetryMarkers])

  useEffect(() => {
    const map = mapRef.current
    if (!mapReadyRef.current || !map) return
    syncPoiMarkers(map, pois)
  }, [pois, syncPoiMarkers])

  useEffect(() => {
    const map = mapRef.current
    if (!mapReadyRef.current || !map) return
    syncTelemetryMarkers(map, telemetryPoints)
  }, [telemetryPoints, syncTelemetryMarkers])

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
      <div ref={mapNode} className="maplibre-stage" aria-label="Interactive TSS DUST map" />
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
      {poiPanel}
      {addPoiPanel}
      {addHazardPanel}
    </section>
  )
}
