/**
 * @param {Array<Record<string, unknown>>} rows Hub GET /poi data[]
 */
export function mapHubPois(rows) {
  if (!Array.isArray(rows)) return []
  return rows.map((row) => {
    const tags = Array.isArray(row.tags) ? row.tags : []
    const typeTag = tags.find((t) => typeof t === "string" && /^(PR|EV|EV1|EV2|LTV)$/i.test(t))
    return {
      id: String(row.id),
      hubId: Number(row.id),
      label: String(row.name ?? `POI ${row.id}`),
      type:
        typeTag ??
        (row.type === "breadCrumb" ? "PR" : String(row.type ?? "PR").slice(0, 3).toUpperCase()),
      tssX: Number(row.x) || 0,
      tssY: Number(row.y) || 0,
      description: String(row.description ?? ""),
      active: false,
      muted: row.type === "breadCrumb",
      breadcrumbStyle: row.type === "poi" || row.type === "breadCrumb",
    }
  })
}

/**
 * @param {object} rover GET /telemetry
 * @param {object} imu1 GET /imu/1
 * @param {object} imu2 GET /imu/2
 * @param {object} ltv GET /ltv
 */
export function mapTelemetryMarkers(rover, imu1, imu2, ltv) {
  const points = []

  if (imu1 && Number.isFinite(imu1.posx)) {
    points.push({
      id: "eva1",
      label: "EV1",
      x: Number(imu1.posx),
      y: Number(imu1.posy),
      heading: Number(imu1.heading) || 0,
    })
  }

  if (imu2 && Number.isFinite(imu2.posx)) {
    points.push({
      id: "eva2",
      label: "EV2",
      x: Number(imu2.posx),
      y: Number(imu2.posy),
      heading: Number(imu2.heading) || 0,
    })
  }

  if (rover && Number.isFinite(rover.currentPosX)) {
    points.push({
      id: "pr",
      label: "PR",
      x: Number(rover.currentPosX),
      y: Number(rover.currentPosY),
      heading: Number(rover.heading) || 0,
      speed: Number(rover.speed) || 0,
    })
  }

  const lx = ltv?.location?.last_known_x
  const ly = ltv?.location?.last_known_y
  if (Number.isFinite(lx) && Number.isFinite(ly)) {
    points.push({
      id: "ltv",
      label: "LTV",
      x: lx,
      y: ly,
      heading: 0,
    })
  }

  return points
}
