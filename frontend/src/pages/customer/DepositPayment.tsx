import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { clearPaying, markPaying } from '@/hooks/usePaymentReturn'
import { apiError } from '@/lib/api'
import { getReservationByCode, startDeposit } from '@/services/reservations'
import { getSettings } from '@/services/settings'

const card = 'border-brand-line rounded-lg border bg-white p-5 md:p-6'
const redButton =
  'bg-brand-red hover:bg-brand-red/90 focus-visible:outline-brand-gold block w-full rounded-sm py-4 text-center text-sm font-bold tracking-[0.15em] text-white uppercase transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2'

const peso = (amount: number) =>
  `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function DepositPayment() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const code = params.get('code') ?? ''
  const [paying, setPaying] = useState(false)
  const { data: reservation, isLoading } = useQuery({
    queryKey: ['reservation', code],
    queryFn: () => getReservationByCode(code),
    enabled: !!code,
  })
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: getSettings })

  useEffect(() => clearPaying(code), [code])

  const header = (
    <div className="flex items-center gap-4">
      <button
        type="button"
        aria-label="Back"
        onClick={() => navigate(-1)}
        className="border-brand-line text-brand-charcoal hover:border-brand-gold flex size-10 shrink-0 items-center justify-center rounded-full border bg-white transition-colors duration-200"
      >
        <ArrowLeft className="size-5" />
      </button>
      <h1 className="text-brand-charcoal font-serif text-3xl md:text-4xl">Deposit Payment</h1>
    </div>
  )

  if (code && isLoading) return null

  if (!reservation) {
    return (
      <div className="bg-brand-cream min-h-[calc(100vh-4rem)] px-4 pt-6 md:py-12">
        <div className="md:mx-auto md:max-w-4xl">
          {header}
          <div className={`${card} mt-8 text-center md:mx-auto md:max-w-md`}>
            <h2 className="text-brand-charcoal font-serif text-2xl">Reservation not found</h2>
            <p className="text-brand-ink/75 mt-3 text-sm">
              We couldn't find a reservation to pay for. Please book a table first.
            </p>
            <Link to="/reserve" className={`${redButton} mt-6`}>
              Reserve a Table
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const amount = peso(reservation.deposit_amount)
  const summary = [
    { label: 'Reference Code', value: reservation.reference_code },
    { label: 'Date', value: format(parseISO(reservation.reservation_date), 'MMMM d, yyyy') },
    {
      label: 'Time',
      value: format(
        parseISO(`${reservation.reservation_date}T${reservation.reservation_time}`),
        'h:mm a',
      ),
    },
    { label: 'Guests', value: String(reservation.pax) },
    { label: 'Name', value: reservation.customer.full_name },
  ]

  return (
    <div className="bg-brand-cream min-h-[calc(100vh-4rem)] px-4 pt-6 md:py-12">
      <div className="md:mx-auto md:max-w-4xl">
        {header}

        <div className="mt-8 space-y-6 md:grid md:grid-cols-2 md:items-start md:gap-8 md:space-y-0">
          <div className="space-y-6">
            <section className={card}>
              <h2 className="text-brand-charcoal font-serif text-2xl">Reservation Summary</h2>
              <dl className="mt-4 space-y-3 text-sm">
                {summary.map((row) => (
                  <div key={row.label} className="flex justify-between gap-4">
                    <dt className="text-brand-ink/70">{row.label}</dt>
                    <dd className="text-brand-charcoal text-right font-semibold">{row.value}</dd>
                  </div>
                ))}
              </dl>
              <p className="text-brand-ink/75 mt-4 text-sm">
                Save this code. You'll need it with your mobile number to find your booking.
              </p>
            </section>

            <section className="bg-brand-charcoal rounded-lg px-5 py-6 text-white md:px-6">
              <h2 className="text-brand-gold text-xs font-bold tracking-[0.2em] uppercase">
                Deposit Amount
              </h2>
              <p className="mt-2 font-serif text-4xl">{amount}</p>
              {settings && (
                <p className="mt-3 text-sm text-white/75">
                  {peso(settings.deposit_per_guest)} per guest × {reservation.pax}{' '}
                  {reservation.pax === 1 ? 'guest' : 'guests'}. This holds your table.
                </p>
              )}
            </section>
          </div>

          <form
            onSubmit={async (event) => {
              event.preventDefault()
              setPaying(true)
              try {
                const pay =
                  reservation.deposit_amount > 0
                    ? await startDeposit(reservation.reference_code)
                    : null
                if (pay) {
                  markPaying(reservation.reference_code)
                  window.location.assign(pay.checkout_url)
                } else navigate(`/reserve/confirmation/${reservation.reference_code}`)
              } catch (e) {
                toast.error(apiError(e))
                setPaying(false)
              }
            }}
          >
            <h2 className="text-brand-charcoal font-serif text-2xl">Payment</h2>
            <p className="text-brand-ink/75 mt-3 text-sm">
              {reservation.deposit_amount > 0
                ? "You'll choose GCash, Maya or card on the next screen."
                : 'No deposit is needed for this booking.'}
            </p>

            <div className="bg-brand-cream/95 border-brand-line sticky bottom-0 -mx-4 mt-8 border-t px-4 py-4 md:static md:mx-0 md:border-0 md:bg-transparent md:p-0">
              {reservation.deposit_status === 'paid' ||
              (reservation.status !== 'pending' && reservation.status !== 'confirmed') ? (
                <>
                  <p className="text-brand-ink/75 mb-3 text-center text-sm">
                    {reservation.deposit_status === 'paid'
                      ? 'This deposit is already paid.'
                      : "This reservation is no longer active, so there's nothing to pay."}
                  </p>
                  <Link
                    to={`/reserve/confirmation/${reservation.reference_code}`}
                    className={redButton}
                  >
                    View Reservation
                  </Link>
                </>
              ) : (
                <button
                  type="submit"
                  disabled={paying}
                  className={`${redButton} disabled:opacity-60`}
                >
                  {reservation.deposit_amount > 0 ? `Pay ${amount}` : 'Continue'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
