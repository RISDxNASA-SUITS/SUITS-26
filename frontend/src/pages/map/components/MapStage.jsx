import { useCallback, useEffect, useRef, useState } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import rockYardImage from "../../../assets/map/rock-yard.png"
import addPlusIcon from "../../../assets/map/Add_Plus.svg"
import editIcon from "../../../assets/map/Edit.svg"
import mapPinIcon from "../../../assets/map/Map_Pin.svg"
import navigationIcon from "../../../assets/map/Navigation.svg"
import removeMinusIcon from "../../../assets/map/Remove_Minus.svg"
import stackSimpleIcon from "../../../assets/map/StackSimple.svg"
import trashIcon from "../../../assets/map/Trash.png"
import evNavigationIcon from "../../../assets/map/EV_Navigation.svg"
import prNavigationIcon from "../../../assets/map/PR_Navigation.svg"
import mapCircleWarningIcon from "../../../assets/map/Map_Circle_Warning.svg"
import mapTriangleWarningIcon from "../../../assets/map/Map_Triangle_Warning.svg"
import {
  hazardZones,
  tssDustCoordinateRange,
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
const LTV_SEARCH_RADIUS_METERS = 1.77 * 310
const LTV_SEARCH_RADIUS_ACTIVATION_DISTANCE_METERS = 30
const GRID_COLUMNS = 30
const GRID_ROWS = 19
const SHARE_ICON_URL = "https://www.figma.com/api/mcp/asset/fbae0cb5-f112-446d-ab97-772406d27ee1"
const PATH_ROUTE_POI_DOT_OFFSET_Y = 9
const PATH_ROUTE_PR_ICON_OFFSET_Y = -15
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

function distanceMeters(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1)
}

function tssToMapCoordinate(x, y) {
  const xPct =
    ((x - tssDustCoordinateRange.xMin) / (tssDustCoordinateRange.xMax - tssDustCoordinateRange.xMin)) * 100
  const yPct =
    100 - ((y - tssDustCoordinateRange.yMin) / (tssDustCoordinateRange.yMax - tssDustCoordinateRange.yMin)) * 100
  return pctToMapCoordinate(Math.min(98, Math.max(2, xPct)), Math.min(98, Math.max(2, yPct)))
}

function mapCoordinateToTss(lng, lat) {
  const xPct = ((lng - IMAGE_WEST) / (IMAGE_EAST - IMAGE_WEST)) * 100
  const northY = latToMercatorY(IMAGE_NORTH)
  const southY = latToMercatorY(IMAGE_SOUTH)
  const mercY = latToMercatorY(lat)
  const yPct = ((mercY - northY) / (southY - northY)) * 100
  return {
    x: tssDustCoordinateRange.xMin + (xPct / 100) * (tssDustCoordinateRange.xMax - tssDustCoordinateRange.xMin),
    y: tssDustCoordinateRange.yMin + ((100 - yPct) / 100) * (tssDustCoordinateRange.yMax - tssDustCoordinateRange.yMin),
  }
}

function zoneFeature(zone) {
  const coordinates = zone.points
    ? [...zone.points.map(([x, y]) => pctToMapCoordinate(x, y)), pctToMapCoordinate(...zone.points[0])]
    : [...zone.vertices.map(({ x, y }) => tssToMapCoordinate(x, y)), tssToMapCoordinate(zone.vertices[0].x, zone.vertices[0].y)]

  return {
    type: "Feature",
    properties: { level: zone.level ?? "warning", name: zone.label ?? zone.name ?? "" },
    geometry: {
      type: "Polygon",
      coordinates: [coordinates],
    },
  }
}

function makeTssCircleFeature(centerX, centerY, radiusMeters, segments = 96) {
  const coordinates = Array.from({ length: segments + 1 }, (_, index) => {
    const theta = (index / segments) * Math.PI * 2
    const x = centerX + radiusMeters * Math.cos(theta)
    const y = centerY + radiusMeters * Math.sin(theta)
    return tssToMapCoordinate(x, y)
  })

  return {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [coordinates],
    },
  }
}

function offsetMapCoordinate(map, [lng, lat], offsetX, offsetY) {
  const projected = map.project([lng, lat])
  return map.unproject([projected.x + offsetX, projected.y + offsetY]).toArray()
}

function bearingDegrees(fromX, fromY, toX, toY) {
  const dx = toX - fromX
  const dy = toY - fromY
  const radians = Math.atan2(dx, dy)
  return (radians * 180) / Math.PI
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
  return el
}

function makeTelemetryElement(point) {
  const el = document.createElement("div")
  el.className = `map-telemetry-marker map-telemetry-marker-${point.id}`
  el.style.setProperty("--heading", `${point.heading || 0}deg`)
  let markerIcon = evNavigationIcon
  if (point.id === "pr") {
    markerIcon = prNavigationIcon
    el.classList.add("map-telemetry-marker-pr")
  } else if (point.id === "ltv") {
    markerIcon = mapPinIcon
    el.classList.add("map-telemetry-marker-ltv")
  }
  el.innerHTML = `<span>${point.label}</span><i><img src="${markerIcon}" alt="" aria-hidden="true" /></i>`
  return el
}

function makeZoneLabel(zone) {
  const points = zone.points
    ? zone.points
    : zone.vertices.map(({ x, y }) => tssToMapCoordinate(x, y))
  const cx = points.reduce((sum, point) => sum + point[0], 0) / points.length
  const cy = points.reduce((sum, point) => sum + point[1], 0) / points.length
  const el = document.createElement("div")
  el.className = `map-zone-label map-zone-label-${zone.level}`
  const warningIcon = zone.level === "danger" ? mapTriangleWarningIcon : mapCircleWarningIcon
  el.innerHTML = `<img src="${warningIcon}" alt="" aria-hidden="true" /><span>${zone.label ?? zone.name}</span>`
  return { el, coordinate: zone.points ? pctToMapCoordinate(cx, cy) : [cx, cy] }
}

function makeHazardPreviewLabel(label, level = "warning") {
  const el = document.createElement("div")
  el.className = `map-hazard-preview-label map-hazard-preview-label-${level}`
  el.textContent = label
  return el
}

export function MapStage({
  pois = [],
  pathPois = [],
  telemetryPoints = [],
  placingPoi = false,
  placingHazard = false,
  hazards = [],
  hazardPreview = null,
  onPlacePoi,
  onPlaceHazard,
  onEditPoi,
  onDeletePoi,
  onEditHazard,
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
  const hazardMarkerRefs = useRef(new Map())
  const poiActionMarkerRef = useRef(null)
  const hazardLabelMarkerRef = useRef(null)
  const selectedPoiIdRef = useRef(null)
  const baseZoomRef = useRef(null)
  const baseCameraRef = useRef(null)
  const is3dRef = useRef(false)
  const isReturningRef = useRef(false)
  const placingPoiRef = useRef(placingPoi)
  const placingHazardRef = useRef(placingHazard)
  const onPlacePoiRef = useRef(onPlacePoi)
  const onPlaceHazardRef = useRef(onPlaceHazard)
  const onEditPoiRef = useRef(onEditPoi)
  const onDeletePoiRef = useRef(onDeletePoi)
  const onEditHazardRef = useRef(onEditHazard)
  const [is3d, setIs3d] = useState(false)

  placingPoiRef.current = placingPoi
  placingHazardRef.current = placingHazard
  onPlacePoiRef.current = onPlacePoi
  onPlaceHazardRef.current = onPlaceHazard
  onEditPoiRef.current = onEditPoi
  onDeletePoiRef.current = onDeletePoi
  onEditHazardRef.current = onEditHazard

  const syncPoiMarkers = useCallback((map, points) => {
    const nextIds = new Set(points.map((poi) => poi.id))

    for (const [id, marker] of poiMarkerRefs.current.entries()) {
      if (!nextIds.has(id)) {
        marker.remove()
        poiMarkerRefs.current.delete(id)
        poiElementRefs.current.delete(id)
      }
    }

    points.forEach((poi) => {
      const lngLat = tssToMapCoordinate(poi.tssX, poi.tssY)
      const existing = poiMarkerRefs.current.get(poi.id)
      if (existing) {
        existing.setLngLat(lngLat)
        return
      }

      const poiElement = makePoiElement(poi)
      poiElementRefs.current.set(poi.id, poiElement)
      poiElement.addEventListener("click", (event) => {
        event.stopPropagation()
        const selectedPoiElement = poiElementRefs.current.get(selectedPoiIdRef.current)
        selectedPoiElement?.classList.remove("is-selected")
        poiActionMarkerRef.current?.remove()

        if (selectedPoiIdRef.current === poi.id) {
          selectedPoiIdRef.current = null
          poiActionMarkerRef.current = null
          return
        }

        poiElement.classList.add("is-selected")
        const menu = makePoiActionMenu()
        menu.addEventListener("click", (menuEvent) => {
          menuEvent.stopPropagation()
          const actionEl = menuEvent.target instanceof Element
            ? menuEvent.target.closest("[data-action]")
            : null
          const action = actionEl?.getAttribute("data-action")
          if (action === "edit") {
            onEditPoiRef.current?.(poi)
          } else if (action === "delete") {
            onDeletePoiRef.current?.(poi.id)
          }
        })
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

  const syncTelemetryMarkers = useCallback((map, points, routePois = []) => {
    const nextIds = new Set(points.map((point) => point.id))
    const firstPathPoi = routePois[0]

    for (const [id, marker] of telemetryMarkerRefs.current.entries()) {
      if (!nextIds.has(id)) {
        marker.remove()
        telemetryMarkerRefs.current.delete(id)
      }
    }

    points.forEach((point) => {
      const lngLat = tssToMapCoordinate(point.x, point.y)
      const heading = point.id === "pr" && firstPathPoi
        ? bearingDegrees(point.x, point.y, firstPathPoi.tssX, firstPathPoi.tssY)
        : (point.heading || 0)
      const existing = telemetryMarkerRefs.current.get(point.id)
      if (existing) {
        existing.setLngLat(lngLat)
        const el = existing.getElement()
        if (el) {
          el.style.setProperty("--heading", `${heading}deg`)
        }
        return
      }

      const marker = new maplibregl.Marker({
        element: makeTelemetryElement({ ...point, heading }),
        anchor: "bottom",
      })
        .setLngLat(lngLat)
        .addTo(map)
      telemetryMarkerRefs.current.set(point.id, marker)
    })
  }, [])

  const syncPathRoute = useCallback((map, routePois, points) => {
    if (!map.getSource("path-route")) return

    const prPoint = points.find((point) => point.id === "pr")
    const coordinates = []

    if (prPoint) {
      coordinates.push(
        offsetMapCoordinate(
          map,
          tssToMapCoordinate(prPoint.x, prPoint.y),
          0,
          PATH_ROUTE_PR_ICON_OFFSET_Y,
        ),
      )
    }

    routePois.forEach((poi) => {
      if (Number.isFinite(poi?.tssX) && Number.isFinite(poi?.tssY)) {
        coordinates.push(
          offsetMapCoordinate(
            map,
            tssToMapCoordinate(poi.tssX, poi.tssY),
            0,
            PATH_ROUTE_POI_DOT_OFFSET_Y,
          ),
        )
      }
    })

    const features = coordinates.length >= 2
      ? [{
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates,
          },
        }]
      : []

    const source = map.getSource("path-route")
    source.setData({ type: "FeatureCollection", features })
  }, [])

  const syncHazardZones = useCallback((map, zoneList) => {
    if (!map.getSource("hazard-zones")) return
    const source = map.getSource("hazard-zones")
    source.setData({
      type: "FeatureCollection",
      features: [...hazardZones.map(zoneFeature), ...zoneList.map(zoneFeature)],
    })
  }, [])

  const syncHazardMarkers = useCallback((map, zoneList) => {
    const nextIds = new Set(zoneList.map((zone) => zone.id))

    for (const [id, marker] of hazardMarkerRefs.current.entries()) {
      if (!nextIds.has(id)) {
        marker.remove()
        hazardMarkerRefs.current.delete(id)
      }
    }

    zoneList.forEach((zone) => {
      const { el, coordinate } = makeZoneLabel(zone)

      el.style.cursor = "pointer"
      el.addEventListener("click", (event) => {
        event.stopPropagation()
        onEditHazardRef.current?.(zone.id)
      })

      const existing = hazardMarkerRefs.current.get(zone.id)
      if (existing) {
        existing.remove()
        hazardMarkerRefs.current.delete(zone.id)
      }

      const marker = new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat(coordinate)
        .addTo(map)
      hazardMarkerRefs.current.set(zone.id, marker)
    })
  }, [])

  const syncHazardPreview = useCallback((map, preview) => {
    if (!map.getSource("hazard-preview")) return

    const coordinates = preview?.vertices?.map(({ x, y }) => tssToMapCoordinate(x, y)) ?? []
    const features = []

    if (coordinates.length >= 2) {
      features.push({
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates,
        },
      })
    }
    if (coordinates.length >= 3) {
      features.push({
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [[...coordinates, coordinates[0]]],
        },
      })
    }

    const source = map.getSource("hazard-preview")
    source.setData({ type: "FeatureCollection", features })

    hazardLabelMarkerRef.current?.remove()
    hazardLabelMarkerRef.current = null
    if (preview?.label && coordinates.length >= 3) {
      const center = coordinates.reduce(
        (acc, [lng, lat]) => [acc[0] + lng / coordinates.length, acc[1] + lat / coordinates.length],
        [0, 0],
      )
      hazardLabelMarkerRef.current = new maplibregl.Marker({
        element: makeHazardPreviewLabel(preview.label, preview.level),
        anchor: "center",
      })
        .setLngLat(center)
        .addTo(map)
    }
  }, [])

  const syncLtvSearchRadius = useCallback((map, points) => {
    if (!map.getSource("ltv-search-radius")) return

    const prPoint = points.find((point) => point.id === "pr")
    const ltvPoint = points.find((point) => point.id === "ltv")
    const features = []

    if (
      prPoint &&
      ltvPoint &&
      Number.isFinite(prPoint.x) &&
      Number.isFinite(prPoint.y) &&
      Number.isFinite(ltvPoint.x) &&
      Number.isFinite(ltvPoint.y)
    ) {
      const arrivalDistance = distanceMeters(prPoint.x, prPoint.y, ltvPoint.x, ltvPoint.y)
      if (arrivalDistance <= LTV_SEARCH_RADIUS_ACTIVATION_DISTANCE_METERS) {
        features.push(makeTssCircleFeature(ltvPoint.x, ltvPoint.y, LTV_SEARCH_RADIUS_METERS))
      }
    }

    const source = map.getSource("ltv-search-radius")
    source.setData({ type: "FeatureCollection", features })
  }, [])

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
    map.on("click", (event) => {
      const selectedPoiElement = poiElementRefs.current.get(selectedPoiIdRef.current)
      selectedPoiElement?.classList.remove("is-selected")
      poiActionMarkerRef.current?.remove()
      poiActionMarkerRef.current = null
      selectedPoiIdRef.current = null
      if (placingHazardRef.current) {
        const { x, y } = mapCoordinateToTss(event.lngLat.lng, event.lngLat.lat)
        onPlaceHazardRef.current?.({ x, y })
        return
      }
      if (!placingPoiRef.current) return
      const { x, y } = mapCoordinateToTss(event.lngLat.lng, event.lngLat.lat)
      onPlacePoiRef.current?.({ x, y })
    })
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
        data: { type: "FeatureCollection", features: [...hazardZones.map(zoneFeature), ...hazards.map(zoneFeature)] },
      })
      map.addSource("hazard-preview", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      })
      map.addSource("path-route", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      })
      map.addSource("ltv-search-radius", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
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
      map.addLayer({
        id: "hazard-preview-fill",
        type: "fill",
        source: "hazard-preview",
        filter: ["==", "$type", "Polygon"],
        paint: {
          "fill-color": "rgba(77, 77, 255, 0.22)",
          "fill-opacity": 0.35,
        },
      })
      map.addLayer({
        id: "hazard-preview-outline",
        type: "line",
        source: "hazard-preview",
        filter: ["==", "$type", "LineString"],
        paint: {
          "line-color": "rgba(77, 77, 255, 0.9)",
          "line-width": 2,
          "line-dasharray": [2, 1.5],
        },
      })
      map.addLayer({
        id: "path-route-line",
        type: "line",
        source: "path-route",
        paint: {
          "line-color": "rgba(245, 247, 251, 0.95)",
          "line-width": 2,
          "line-dasharray": [3, 2],
        },
      })
      map.addLayer({
        id: "ltv-search-radius-fill",
        type: "fill",
        source: "ltv-search-radius",
        paint: {
          "fill-color": "rgba(22, 132, 255, 0.12)",
          "fill-opacity": 0.32,
        },
      })
      map.addLayer({
        id: "ltv-search-radius-outline",
        type: "line",
        source: "ltv-search-radius",
        paint: {
          "line-color": "rgba(74, 176, 255, 0.95)",
          "line-width": 2,
          "line-dasharray": [4, 2],
        },
      })

      hazardZones.forEach((zone) => {
        const { el, coordinate } = makeZoneLabel(zone)
        new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat(coordinate).addTo(map)
      })

      mapReadyRef.current = true
      syncPoiMarkers(map, pois)
      syncTelemetryMarkers(map, telemetryPoints, pathPois)
      syncPathRoute(map, pathPois, telemetryPoints)
      syncLtvSearchRadius(map, telemetryPoints)
      syncHazardZones(map, hazards)
      syncHazardMarkers(map, hazards)
      syncHazardPreview(map, hazardPreview)
    })

    return () => {
      const selectedPoiElement = poiElementRefs.current.get(selectedPoiIdRef.current)
      selectedPoiElement?.classList.remove("is-selected")
      poiActionMarkerRef.current?.remove()
      poiActionMarkerRef.current = null
      hazardLabelMarkerRef.current?.remove()
      hazardLabelMarkerRef.current = null
      selectedPoiIdRef.current = null
      poiElementRefs.current.clear()
      poiMarkerRefs.current.clear()
      telemetryMarkerRefs.current.forEach((marker) => marker.remove())
      telemetryMarkerRefs.current.clear()
      hazardMarkerRefs.current.forEach((marker) => marker.remove())
      hazardMarkerRefs.current.clear()
      mapReadyRef.current = false
      resizeObserver.disconnect()
      map.remove()
      mapRef.current = null
    }
  }, [syncHazardMarkers, syncHazardPreview, syncHazardZones, syncLtvSearchRadius, syncPathRoute, syncPoiMarkers, syncTelemetryMarkers])

  useEffect(() => {
    if (!mapRef.current || !mapReadyRef.current) return
    const canvas = mapRef.current.getCanvas()
    canvas.style.cursor = placingPoi || placingHazard ? "crosshair" : ""
    return () => {
      canvas.style.cursor = ""
    }
  }, [placingPoi, placingHazard])

  useEffect(() => {
    if (!mapReadyRef.current || !mapRef.current) return
    syncPoiMarkers(mapRef.current, pois)
  }, [pois, syncPoiMarkers])

  useEffect(() => {
    if (!mapReadyRef.current || !mapRef.current) return
    syncTelemetryMarkers(mapRef.current, telemetryPoints, pathPois)
  }, [pathPois, syncTelemetryMarkers, telemetryPoints])

  useEffect(() => {
    if (!mapReadyRef.current || !mapRef.current) return
    syncPathRoute(mapRef.current, pathPois, telemetryPoints)
  }, [pathPois, syncPathRoute, telemetryPoints])

  useEffect(() => {
    if (!mapReadyRef.current || !mapRef.current) return
    syncLtvSearchRadius(mapRef.current, telemetryPoints)
  }, [syncLtvSearchRadius, telemetryPoints])

  useEffect(() => {
    if (!mapReadyRef.current || !mapRef.current) return
    syncHazardZones(mapRef.current, hazards)
  }, [hazards, syncHazardZones])

  useEffect(() => {
    if (!mapReadyRef.current || !mapRef.current) return
    syncHazardMarkers(mapRef.current, hazards)
  }, [hazards, syncHazardMarkers])

  useEffect(() => {
    if (!mapReadyRef.current || !mapRef.current) return
    syncHazardPreview(mapRef.current, hazardPreview)
  }, [hazardPreview, syncHazardPreview])

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
    <section className={`map-stage${placingPoi || placingHazard ? " map-stage--placing-poi" : ""}`}>
      <div ref={mapNode} className="maplibre-stage" aria-label="Interactive TSS DUST rock yard map" />
      {(placingPoi || placingHazard) && (
        <div className="map-place-poi-hint" role="status">
          {placingHazard
            ? "Click to add vertices. Click back on the first vertex to save the hazard."
            : "Click anywhere on the map to place a POI"}
        </div>
      )}
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
