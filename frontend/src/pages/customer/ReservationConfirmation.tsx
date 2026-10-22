import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { Check } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { getReservationByCode } from '@/services/reservations'

const primaryButton =
  'bg-brand-green hover:bg-brand-green/90 focus-visible:outline-brand-leaf block w-full rounded-full py-3.5 text-center text-sm font-semibold text-white transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2'
const outlineButton =
  'border-brand-green text-brand-green hover:bg-brand-cream focus-visible:outline-brand-leaf block w-full rounded-full border py-3.5 text-center text-sm font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2'

export default function ReservationConfirmation() {
  const { code = '' } = useParams()
  const { data: reservation, isLoading } = useQuery({
    queryKey: ['reservation', code],
    queryFn: () => getReservationByCode(code),
  })

  if (isLoading) return null

  if (!reservation) {
    return (
      <div className="px-4 py-16 text-center">
        <h1 className="text-brand-brown text-2xl font-bold">Reservation not found</h1>
        <p className="text-brand-ink/70 mt-3 text-sm">
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
    <div className="px-4 pt-12 pb-16">
      <div className="text-center">
        <div className="border-brand-green text-brand-green mx-auto flex size-16 items-center justify-center rounded-full border-2">
          <Check className="size-8" strokeWidth={1.5} />
        </div>
        <h1 className="text-brand-brown mt-6 text-2xl font-bold tracking-tight">
          Reservation Confirmed
        </h1>
        <p className="text-brand-ink/70 mt-2 text-sm">
          A confirmation SMS was sent to {reservation.customer.mobile_number}
        </p>
      </div>

      <div className="border-brand-sage bg-brand-cream/60 mt-8 rounded-md border border-dashed px-4 py-4 text-center">
        <p className="text-brand-ink/70 text-xs font-semibold tracking-[0.22em] uppercase">
          Reference Code
        </p>
        <p className="text-brand-green mt-1 text-2xl font-bold tracking-wide">
          {reservation.reference_code}
        </p>
      </div>

      <section className="border-brand-sage/40 mt-6 rounded-md border px-4 pt-4 pb-1">
        <h2 className="text-brand-brown font-bold">Details</h2>
        <dl className="mt-2">
          {details.map((detail) => (
            <div
              key={detail.label}
              className="border-brand-sage/30 flex justify-between gap-4 border-b py-3 text-sm last:border-b-0"
            >
              <dt className="text-brand-ink/70">{detail.label}</dt>
              <dd className="font-semibold tabular-nums">{detail.value}</dd>
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
