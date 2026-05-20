/**
 * @typedef {object} LiveTelemetryPayload
 * @property {number} timestamp
 * @property {string} tssHost
 * @property {boolean} tssConnected
 * @property {string | null} error
 * @property {Record<string, unknown> | null} rover
 * @property {number[] | null} lidar
 */

/**
 * @param {unknown} raw
 * @returns {LiveTelemetryPayload | null}
 */
export function parseLiveTelemetry(raw) {
  if (!raw || typeof raw !== "object") return null
  const o = /** @type {Record<string, unknown>} */ (raw)
  if (typeof o.timestamp !== "number") return null
  return {
    timestamp: o.timestamp,
    tssHost: String(o.tssHost ?? ""),
    tssConnected: Boolean(o.tssConnected),
    error: o.error != null ? String(o.error) : null,
    rover: o.rover && typeof o.rover === "object" ? /** @type {Record<string, unknown>} */ (o.rover) : null,
    lidar: Array.isArray(o.lidar) ? o.lidar.map((v) => Number(v)) : null,
  }
}
