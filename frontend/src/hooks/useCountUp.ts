import { useEffect, useRef, useState } from 'react'

export default function useCountUp(value: number, duration = 600) {
  const [shown, setShown] = useState(value)
  const from = useRef(value)

  useEffect(() => {
    const start = from.current
    from.current = value
    if (start === value || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(value)
      return
    }
    const began = performance.now()
    let frame = requestAnimationFrame(function step(now) {
      const t = Math.min(1, (now - began) / duration)
      setShown(start + (value - start) * (1 - (1 - t) ** 3))
      if (t < 1) frame = requestAnimationFrame(step)
    })
    return () => {
      cancelAnimationFrame(frame)
      setShown(value)
    }
  }, [value, duration])

  return Math.round(shown * 100) / 100
}
