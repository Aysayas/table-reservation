import { useEffect, useRef, useState } from 'react'

export default function useCountUp(value: number, duration = 600) {
  const [shown, setShown] = useState(value)
  const current = useRef(value)

  useEffect(() => {
    const start = current.current
    if (start === value || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      current.current = value
      setShown(value)
      return
    }
    const began = performance.now()
    let frame = requestAnimationFrame(function step(now) {
      const t = Math.min(1, (now - began) / duration)
      current.current = start + (value - start) * (1 - (1 - t) ** 3)
      setShown(current.current)
      if (t < 1) frame = requestAnimationFrame(step)
    })
    return () => cancelAnimationFrame(frame)
  }, [value, duration])

  return Math.round(shown * 100) / 100
}
