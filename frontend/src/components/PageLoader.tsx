import { useEffect, useState } from 'react'
import Ornament from '@/components/Ornament'
import Moment from '@/components/Moment'

export default function PageLoader({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShown(true), 300)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      role="status"
      className={`flex min-h-[60dvh] flex-col items-center justify-center gap-3 px-4 ${tone === 'dark' ? 'bg-brand-charcoal' : ''}`}
    >
      <span className="sr-only">Loading</span>
      {shown && (
        <div
          aria-hidden="true"
          className="flex flex-col items-center gap-3 motion-safe:animate-[dialog-in_300ms_ease-out]"
        >
          <Moment kind="loading" className="size-24" />
          <span
            className={`font-display text-2xl leading-none ${tone === 'dark' ? 'text-brand-gold' : 'text-brand-gold-deep'}`}
          >
            Sandali lang…
          </span>
          <Ornament tone={tone} className="w-28" />
        </div>
      )}
    </div>
  )
}
