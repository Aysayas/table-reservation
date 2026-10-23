import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { Check } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { getReservationByCode } from '@/services/reservations'

const primaryButton =
  'bg-brand-red hover:bg-brand-red/90 focus-visible:outline-brand-red block w-full rounded-sm py-4 text-center text-sm font-bold tracking-[0.15em] text-white uppercase transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2'
const darkButton =
  'bg-brand-charcoal border-brand-gold text-brand-gold hover:bg-brand-charcoal/90 focus-visible:outline-brand-red block w-full rounded-sm border py-4 text-center text-sm font-bold tracking-[0.15em] uppercase transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2'
const smallLabel = 'text-brand-ink/75 text-xs font-bold tracking-[0.15em] uppercase'
const notch =
  'bg-brand-cream border-brand-gold/50 absolute top-1/2 size-6 -translate-y-1/2 rounded-full border'

export default function ReservationConfirmation() {
  const { code = '' } = useParams()
  const { data: reservation, isLoading } = useQuery({
    queryKey: ['reservation', code],
    queryFn: () => getReservationByCode(code),
  })

  if (isLoading) return null

  if (!reservation) {
    return (
      <div className="bg-brand-cream min-h-[calc(100vh-4rem)] px-4 py-16 text-center">
        <h1 className="text-brand-charcoal font-serif text-4xl leading-tight">
          Reservation not found
        </h1>
        <p className="text-brand-ink/75 mt-3 text-sm">
          We couldn't find a reservation with that reference code.
        </p>
        <div className="mt-8">
          <Link to="/" className={primaryButton}>
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  const details = [
    { label: 'Date', value: format(parseISO(reservation.reservation_date), 'EEE, MMM d, yyyy') },
    {
      label: 'Time',
      value: format(
        parseISO(`${reservation.reservation_date}T${reservation.reservation_time}`),
        'h:mm a',
      ),
    },
    {
      label: 'Guests',
      value: `${reservation.pax} ${reservation.pax === 1 ? 'person' : 'people'}`,
    },
    { label: 'Deposit Paid', value: `₱${reservation.deposit_amount.toFixed(2)}` },
  ]

  return (
    <div className="bg-brand-cream px-4 pt-12 pb-16">
      <div className="text-center">
        <div className="bg-brand-red mx-auto flex size-24 items-center justify-center rounded-full text-white">
          <Check className="size-11" strokeWidth={2} />
        </div>
        <p className="font-display text-brand-red mt-6 text-5xl">Salamat!</p>
        <h1 className="text-brand-charcoal mt-1 font-serif text-4xl leading-tight">
          Your table is reserved
        </h1>
        <p className="text-brand-ink/75 mt-6 text-sm">
          A confirmation SMS was sent to{' '}
          <strong className="text-brand-charcoal">{reservation.customer.mobile_number}</strong>
        </p>
      </div>

      <section className="border-brand-gold/50 relative mt-8 rounded-xl border bg-white">
        <div className="px-6 pt-6 pb-6 text-center">
          <p className="text-brand-gold-deep text-xs font-bold tracking-[0.3em] uppercase">
            Reference Code
          </p>
          <p className="text-brand-charcoal mt-2 font-serif text-4xl font-bold tracking-wide">
            {reservation.reference_code}
          </p>
        </div>

        <div aria-hidden="true" className="relative">
          <span className={`${notch} -left-3`} />
          <div className="border-brand-gold/60 mx-6 border-t border-dashed" />
          <span className={`${notch} -right-3`} />
        </div>

        <div className="px-6 pt-5 pb-5">
          <h2 className="sr-only">Details</h2>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-5">
            {details.map((detail) => (
              <div key={detail.label}>
                <dt className={smallLabel}>{detail.label}</dt>
                <dd className="text-brand-charcoal mt-1 font-semibold tabular-nums">
                  {detail.value}
                </dd>
              </div>
            ))}
          </dl>
          <div className="border-brand-charcoal/10 mt-5 flex items-center justify-between border-t pt-4">
            <p className={smallLabel}>Status</p>
            <p className="bg-brand-green/10 text-brand-green flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold tracking-[0.15em] uppercase">
              <span aria-hidden="true">●</span>
              <span>
                {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
              </span>
            </p>
          </div>
        </div>
      </section>

      <div className="mt-10 space-y-3">
        <Link to="/" className={primaryButton}>
          Back to Home
        </Link>
        <Link to="/reservation" className={darkButton}>
          Manage Reservation
        </Link>
      </div>
    </div>
  )
}
