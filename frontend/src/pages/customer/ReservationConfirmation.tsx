import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { Check } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { getReservationByCode } from '@/services/reservations'

const primaryButton =
  'bg-brand-red hover:bg-brand-red/90 focus-visible:outline-brand-red block w-full rounded-sm py-4 text-center text-sm font-bold tracking-[0.15em] text-white uppercase transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2'
const outlineButton =
  'border-brand-charcoal text-brand-charcoal hover:bg-brand-charcoal focus-visible:outline-brand-red block w-full rounded-sm border py-4 text-center text-sm font-bold tracking-[0.15em] uppercase transition-colors duration-200 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2'

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
    { label: 'Date', value: format(parseISO(reservation.reservation_date), 'MMMM d, yyyy') },
    {
      label: 'Time',
      value: format(
        parseISO(`${reservation.reservation_date}T${reservation.reservation_time}`),
        'h:mm a',
      ),
    },
    { label: 'Guests', value: reservation.pax },
    { label: 'Deposit Paid', value: `₱${reservation.deposit_amount.toFixed(2)}` },
    {
      label: 'Status',
      value: reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1),
    },
  ]

  return (
    <div className="bg-brand-cream px-4 pt-12 pb-16">
      <div className="text-center">
        <div className="border-brand-gold text-brand-red mx-auto flex size-20 items-center justify-center rounded-full border bg-white">
          <Check className="size-10" strokeWidth={1.5} />
        </div>
        <h1 className="text-brand-charcoal mt-6 font-serif text-4xl leading-tight">
          Reservation Confirmed
        </h1>
        <p className="text-brand-ink/75 mt-3 text-sm">
          A confirmation SMS was sent to {reservation.customer.mobile_number}
        </p>
      </div>

      <div className="bg-brand-charcoal border-brand-gold mt-8 rounded-lg border border-dashed px-4 py-5 text-center">
        <p className="text-brand-gold text-xs font-bold tracking-[0.25em] uppercase">
          Reference Code
        </p>
        <p className="mt-2 font-serif text-3xl tracking-wide text-white">
          {reservation.reference_code}
        </p>
      </div>

      <section className="border-brand-gold/40 mt-6 rounded-lg border bg-white px-5 pt-5 pb-1">
        <h2 className="text-brand-charcoal font-serif text-2xl">Details</h2>
        <dl className="mt-2">
          {details.map((detail) => (
            <div
              key={detail.label}
              className="border-brand-charcoal/10 flex justify-between gap-4 border-b py-3.5 text-sm last:border-b-0"
            >
              <dt className="text-brand-ink/75">{detail.label}</dt>
              <dd className="text-brand-charcoal font-semibold tabular-nums">{detail.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-10 space-y-3">
        <Link to="/" className={primaryButton}>
          Back to Home
        </Link>
        <Link to="/reservation" className={outlineButton}>
          Manage Reservation
        </Link>
      </div>
    </div>
  )
}
