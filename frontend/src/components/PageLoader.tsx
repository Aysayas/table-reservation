import { useEffect, useState } from 'react'
import Ornament from '@/components/Ornament'

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
          <span className="relative block size-16">
            <span className="border-brand-gold/25 border-t-brand-gold absolute inset-0 rounded-full border-2 motion-safe:animate-spin motion-safe:[animation-duration:1.4s]" />
            <span className="absolute inset-2 overflow-hidden rounded-full">
              <img
                src="/logo.png"
                alt=""
                className="size-full scale-[2.2] object-cover object-top"
              />
            </span>
          </span>
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
