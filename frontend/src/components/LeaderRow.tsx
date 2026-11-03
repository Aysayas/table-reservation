import type { ReactNode } from 'react'

type Props = {
  term: ReactNode
  children: ReactNode
  className?: string
  termClassName?: string
  valueClassName?: string
}

export default function LeaderRow({
  term,
  children,
  className = '',
  termClassName = 'text-brand-ink/70',
  valueClassName = 'text-brand-charcoal font-semibold',
}: Props) {
  return (
    <div className={`flex items-baseline gap-2 ${className}`}>
      <dt className={`shrink-0 ${termClassName}`}>{term}</dt>
      <span
        aria-hidden="true"
        className="border-brand-gold-deep/50 min-w-4 flex-1 border-b border-dotted"
      />
      <dd className={`text-right ${valueClassName}`}>{children}</dd>
    </div>
  )
}
