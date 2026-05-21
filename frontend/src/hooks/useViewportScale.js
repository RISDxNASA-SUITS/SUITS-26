import { useState, useEffect } from "react"

export function useViewportScale(ref) {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    function update() {
      if (!ref.current) return
      const el = ref.current
      // remove zoom temporarily to measure natural content height
      el.style.zoom = ""
      // measure natural content size
      const naturalH = el.scrollHeight
      const naturalW = el.scrollWidth
      const scaleH = window.innerHeight / naturalH
      const scaleW = window.innerWidth / naturalW
      // choose the smaller scale so content fits both dimensions
      const final = Math.min(scaleH, scaleW, 1)
      el.style.zoom = final
      setScale(final)
    }
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [ref])

  return scale
}
