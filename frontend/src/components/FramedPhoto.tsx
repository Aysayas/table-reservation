import type { ReactNode } from 'react'

export default function FramedPhoto({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`relative ${className}`}>
      <span
        aria-hidden="true"
        className="border-brand-gold/70 absolute inset-0 translate-x-2 translate-y-2 border"
      />
      <div className="relative">{children}</div>
    </div>
  )
}
