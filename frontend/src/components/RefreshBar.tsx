import { useIsFetching } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

export default function RefreshBar() {
  const fetching = useIsFetching() > 0
  const [shown, setShown] = useState(false)

  useEffect(() => {
    if (!fetching) return
    const timer = setTimeout(() => setShown(true), 600)
    return () => {
      clearTimeout(timer)
      setShown(false)
    }
  }, [fetching])

  if (!fetching || !shown) return null

  return (
    <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden">
      <span className="bg-brand-gold block h-full w-1/3 motion-safe:animate-[refresh_1.2s_ease-in-out_infinite]" />
    </span>
  )
}
