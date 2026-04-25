import { useLayoutEffect, useRef, useState } from 'react'

/**
 * Figma `7383:106469` — LTV bearing dial drawn procedurally (Canvas 2D, no SVG / no raster assets).
 * Parent can be non-square; the dial is always a circle inscribed in the box.
 *
 * @param {{ className?: string; bearingDeg?: number }} props
 * `bearingDeg`: clockwise from north, 0–360.
 */
export default function LtvDirectionalBearing({ className = '', bearingDeg = 0 }) {
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)
  const [pxSize, setPxSize] = useState(256)

  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const measure = () => {
      const r = el.getBoundingClientRect()
      const d = Math.max(64, Math.floor(Math.min(r.width, r.height)))
      setPxSize(d)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useLayoutEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || pxSize < 8) return
    const dpr = Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1)
    canvas.width = Math.round(pxSize * dpr)
    canvas.height = Math.round(pxSize * dpr)
    canvas.style.width = `${pxSize}px`
    canvas.style.height = `${pxSize}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    drawDial(ctx, pxSize, bearingDeg)
  }, [pxSize, bearingDeg])

  return (
    <div
      ref={wrapRef}
      className={`flex items-center justify-center ${className}`}
      data-node-id="7383:106469"
      data-figma-component-id="5150:10004"
    >
      <canvas
        ref={canvasRef}
        className="block shrink-0 rounded-full border border-[#191f3c] bg-[#060f1c] shadow-[inset_0_0_14px_rgba(0,0,0,0.22)]"
        role="img"
        aria-label={`LTV directional bearing ${Math.round(bearingDeg)} degrees clockwise from north`}
      />
    </div>
  )
}

/** Canvas Y-down; `a` is standard math angle (0 = east, π/2 = south). */
function bearingToAngleRad(bearingDeg) {
  return -Math.PI / 2 + (bearingDeg * Math.PI) / 180
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} size css pixels (square)
 * @param {number} bearingDeg
 */
function drawDial(ctx, size, bearingDeg) {
  const cx = size * 0.5
  const cy = size * 0.5
  const R = size * 0.5 - 1.5
  const theta = bearingToAngleRad(bearingDeg)

  ctx.clearRect(0, 0, size, size)

  // Clip to circle
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, R, 0, Math.PI * 2)
  ctx.clip()

  // Face — flat like Figma `rgba(0,0,0,0.1)` overlay on midnight
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R)
  g.addColorStop(0, '#0b1520')
  g.addColorStop(1, '#060f1c')
  ctx.fillStyle = g
  ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R)

  // Few distance rings only (Figma-style concentric arcs)
  ctx.strokeStyle = 'rgba(82, 109, 130, 0.28)'
  ctx.lineWidth = Math.max(0.6, size * 0.0028)
  ;[0.36, 0.54, 0.72].forEach((t) => {
    ctx.beginPath()
    ctx.arc(cx, cy, R * t, 0, Math.PI * 2)
    ctx.stroke()
  })

  // Barely-visible N–S / E–W (matches Figma crosshair weight)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.045)'
  ctx.lineWidth = Math.max(0.5, size * 0.0016)
  ctx.beginPath()
  ctx.moveTo(cx - R * 0.97, cy)
  ctx.lineTo(cx + R * 0.97, cy)
  ctx.moveTo(cx, cy - R * 0.97)
  ctx.lineTo(cx, cy + R * 0.97)
  ctx.stroke()

  // Range labels along north axis
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
  ctx.font = `${Math.max(6, Math.round(size * 0.026))}px Inter, system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const labels = [
    { t: '500', f: 0.12 },
    { t: '300', f: 0.22 },
    { t: '150', f: 0.32 },
    { t: '50', f: 0.42 },
  ]
  const north = -Math.PI / 2
  for (const { t, f } of labels) {
    const rr = R * f
    ctx.fillText(t, cx + rr * Math.cos(north), cy + rr * Math.sin(north))
  }

  // Cardinal letters
  const cardFont = `${Math.max(9, Math.round(size * 0.038))}px Inter, system-ui, sans-serif`
  ctx.font = cardFont
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)'
  const pad = R * 0.08
  const re = R - pad
  ctx.fillText('N', cx + re * Math.cos(north), cy + re * Math.sin(north))
  ctx.fillText('S', cx + re * Math.cos(Math.PI / 2), cy + re * Math.sin(Math.PI / 2))
  ctx.fillText('E', cx + re * Math.cos(0), cy + re * Math.sin(0))
  ctx.fillText('W', cx + re * Math.cos(Math.PI), cy + re * Math.sin(Math.PI))

  ctx.restore()

  // —— Rotating hand: arrow + range dot (only these use `theta`) ——
  const hubR = Math.max(2.25, size * 0.015)
  const arrowLen = R * 0.76
  const dotR = R * 0.66

  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(theta)

  // Arrow shaft + head (along +X after rotate)
  ctx.strokeStyle = '#00b288'
  ctx.fillStyle = '#00b288'
  ctx.lineWidth = Math.max(1.1, size * 0.0045)
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(hubR + 0.5, 0)
  ctx.lineTo(arrowLen - size * 0.045, 0)
  ctx.stroke()

  const tip = arrowLen
  const hw = Math.max(4, size * 0.03)
  ctx.beginPath()
  ctx.moveTo(tip, 0)
  ctx.lineTo(tip - hw * 1.05, -hw * 0.5)
  ctx.lineTo(tip - hw * 1.05, hw * 0.5)
  ctx.closePath()
  ctx.fill()

  // Range dot (small satellite)
  ctx.fillStyle = 'rgba(125, 211, 192, 0.95)'
  ctx.beginPath()
  ctx.arc(dotR, 0, Math.max(1.8, size * 0.011), 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()

  // Fixed pivot: short cross + small hub (Figma `10030`–`10033` — minimal)
  ctx.strokeStyle = 'rgba(107, 138, 174, 0.32)'
  ctx.lineWidth = Math.max(0.65, size * 0.0022)
  const stem = R * 0.055
  ctx.beginPath()
  ctx.moveTo(cx - stem, cy)
  ctx.lineTo(cx + stem, cy)
  ctx.moveTo(cx, cy - stem)
  ctx.lineTo(cx, cy + stem)
  ctx.stroke()

  ctx.fillStyle = '#152433'
  ctx.strokeStyle = 'rgba(107, 138, 174, 0.38)'
  ctx.lineWidth = Math.max(0.55, size * 0.002)
  ctx.beginPath()
  ctx.arc(cx, cy, hubR, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
}
