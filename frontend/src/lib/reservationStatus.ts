import type { ReservationStatus } from '@/types/db'

export const reservationStatuses: Record<ReservationStatus, { text: string; className: string }> = {
  pending: { text: 'Pending', className: 'bg-brand-gold/20 text-brand-gold-deep' },
  confirmed: { text: 'Confirmed', className: 'bg-brand-green text-white' },
  arrived: { text: 'Arrived', className: 'bg-brand-charcoal text-white' },
  no_show: { text: 'No-show', className: 'bg-brand-ink/10 text-brand-ink' },
  cancelled: { text: 'Cancelled', className: 'bg-brand-red/10 text-brand-red' },
}
