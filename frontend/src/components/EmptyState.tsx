import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type Props = {
  icon: LucideIcon
  title: string
  text?: string
  action?: ReactNode
  className?: string
}

export default function EmptyState({ icon: Icon, title, text, action, className = '' }: Props) {
  return (
    <div className={`flex flex-col items-center px-4 py-10 text-center ${className}`}>
      <span
        aria-hidden="true"
        className="border-brand-gold/60 text-brand-gold-deep flex size-14 items-center justify-center rounded-full border"
      >
        <Icon className="size-6" strokeWidth={1.5} />
      </span>
      <p className="text-brand-charcoal mt-4 font-serif text-xl">{title}</p>
      {text && <p className="text-brand-ink/75 mt-2 max-w-xs text-sm">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
