import { useEffect, useRef, useState } from 'react'

export default function useStatusFlash(rows: { id: number; status: string }[]) {
  const seen = useRef<Map<number, string>>(null)
  const [flashing, setFlashing] = useState<number[]>([])
  const key = rows.map((r) => `${r.id}:${r.status}`).join(',')

  useEffect(() => {
    const before = seen.current
    seen.current = new Map(
      key ? key.split(',').map((p) => [Number(p.split(':')[0]), p.split(':')[1]]) : [],
    )
    if (!before) return
    const changed = [...seen.current].filter(([id, s]) => before.has(id) && before.get(id) !== s)
    if (!changed.length) return
    setFlashing(changed.map(([id]) => id))
    const timer = setTimeout(() => setFlashing([]), 1200)
    return () => clearTimeout(timer)
  }, [key])

  return (id: number) => (flashing.includes(id) ? 'motion-safe:animate-flash' : '')
}
