import { useEffect, useRef, useState } from 'react'

export default function useStatusFlash(rows: { id: number; status: string }[]) {
  const seen = useRef<Map<number, string>>(null)
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>())
  const [flashing, setFlashing] = useState<number[]>([])
  const key = rows.map((r) => `${r.id}:${r.status}`).join(',')

  useEffect(() => {
    const before = seen.current
    seen.current = new Map(
      key ? key.split(',').map((p) => [Number(p.split(':')[0]), p.split(':')[1]]) : [],
    )
    if (!before) return
    const ids = [...seen.current]
      .filter(([id, s]) => before.has(id) && before.get(id) !== s)
      .map(([id]) => id)
    if (!ids.length) return
    setFlashing((f) => [...f.filter((id) => !ids.includes(id)), ...ids])
    const timer = setTimeout(() => {
      timers.current.delete(timer)
      setFlashing((f) => f.filter((id) => !ids.includes(id)))
    }, 1200)
    timers.current.add(timer)
  }, [key])

  useEffect(() => {
    const live = timers.current
    return () => live.forEach(clearTimeout)
  }, [])

  return (id: number) => (flashing.includes(id) ? 'motion-safe:animate-flash' : '')
}
