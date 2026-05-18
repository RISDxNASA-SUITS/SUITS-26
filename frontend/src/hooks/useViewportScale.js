import { useState, useEffect } from "react"

export function useViewportScale(ref) {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    function update() {
      if (!ref.current) return
      const el = ref.current
      // remove zoom temporarily to measure natural content height
      el.style.zoom = ""
      const naturalH = el.scrollHeight
      el.style.zoom = Math.min(window.innerHeight / naturalH, 1)
      setScale(Math.min(window.innerHeight / naturalH, 1))
    }
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [ref])

  return scale
}
