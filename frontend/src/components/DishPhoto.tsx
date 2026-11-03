import { useState } from 'react'

type Props = {
  name: string
  src?: string | null
  className: string
  letter?: string
  eager?: boolean
}

export default function DishPhoto({ name, src, className, letter = 'text-2xl', eager }: Props) {
  const [loaded, setLoaded] = useState(false)
  return src ? (
    <img
      src={src}
      alt={`${name} photo`}
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : undefined}
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={() => setLoaded(true)}
      className={`${className} bg-brand-cream object-cover motion-safe:transition-[opacity,transform,translate,scale]! motion-safe:duration-700 ${loaded ? 'opacity-100' : 'opacity-0'}`}
    />
  ) : (
    <div
      role="img"
      aria-label={`${name} photo`}
      className={`${className} bg-brand-cream flex items-center justify-center p-1.5`}
    >
      <span className="border-brand-gold/50 flex size-full items-center justify-center rounded-[inherit] border">
        <span aria-hidden="true" className={`text-brand-gold-deep font-serif ${letter}`}>
          {name.trim().charAt(0)}
        </span>
      </span>
    </div>
  )
}
