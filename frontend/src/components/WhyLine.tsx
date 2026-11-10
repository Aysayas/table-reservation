import { Sparkle } from 'lucide-react'
import type { RecommendReason } from '@/services/menu'

type Props = {
  reason?: RecommendReason
  names: { item_id: number; name: string }[]
}

export default function WhyLine({ reason, names }: Props) {
  if (!reason) return null
  const text =
    reason.type === 'together'
      ? `Goes with ${names.find((n) => n.item_id === reason.with_item_id)?.name ?? 'your order'}`
      : reason.type === 'popular'
        ? 'Popular lately'
        : "Kitchen's pick"
  return (
    <p className="text-brand-gold-deep mt-1 flex items-start gap-1 text-[11px] leading-snug">
      <Sparkle aria-hidden className="fill-brand-gold text-brand-gold mt-0.5 size-2.5 shrink-0" />
      <span className="line-clamp-2">{text}</span>
    </p>
  )
}
