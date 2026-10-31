import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import useAccount from '@/hooks/useAccount'
import { submitButton } from '@/lib/accountForm'
import { apiError } from '@/lib/api'
import { formatTime } from '@/lib/hours'
import { reservationStatuses } from '@/lib/reservationStatus'
import { listMyReservations } from '@/services/account'
import { cancelReservation } from '@/services/reservations'

const peso = (amount: number) =>
  `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const outlineButton =
  'border-brand-charcoal text-brand-charcoal hover:bg-brand-charcoal rounded-sm border px-3 py-3 text-center text-xs font-bold tracking-[0.1em] uppercase transition-colors duration-200 hover:text-white disabled:opacity-50'

export default function MyReservations() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const queryClient = useQueryClient()
  const { data: account, isLoading: accountLoading } = useAccount()
  const {
    data: reservations = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['my-reservations', account?.user_id],
    queryFn: () => listMyReservations(account!),
    enabled: !!account,
  })
  const cancel = useMutation({
    mutationFn: (code: string) => cancelReservation(code, account?.mobile_number ?? ''),
    onSuccess: () => {
      toast.success('Reservation cancelled')
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] })
    },
    onError: (e) => toast.error(apiError(e, "Couldn't cancel the reservation")),
  })

  if (accountLoading) return null
  if (!account) return <Navigate to={`/login?next=${encodeURIComponent(pathname)}`} replace />

  return (
    <div className="bg-brand-cream min-h-[calc(100vh-4rem)] px-4 pt-6 pb-12 md:py-12">
      <div className="md:mx-auto md:max-w-2xl">
        <h1 className="text-brand-charcoal font-serif text-3xl md:text-4xl">My Reservations</h1>
        <p className="text-brand-ink/75 mt-3 text-sm">Hi, {account.full_name}.</p>

        {isLoading && (
          <p role="status" className="text-brand-ink/75 mt-8 text-sm">
            Loading your reservations…
          </p>
        )}

        {isError && (
          <div role="alert" className="text-brand-ink/75 mt-8 text-sm">
            <p>We couldn't load your reservations.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className={`${outlineButton} mt-3 px-5`}
            >
              Try Again
            </button>
          </div>
        )}

        {!isLoading && !isError && reservations.length === 0 && (
          <div className="border-brand-line mt-8 rounded-lg border bg-white p-5 text-center md:p-6">
            <h2 className="text-brand-charcoal font-serif text-2xl">No reservations yet</h2>
            <p className="text-brand-ink/75 mt-3 text-sm">
              Bookings you make while logged in will show up here.
            </p>
            <Link to="/reserve" className={`${submitButton} mt-6`}>
              Reserve a Table
            </Link>
          </div>
        )}

        <ul className="mt-8 space-y-4">
          {reservations.map((r) => {
            const status = reservationStatuses[r.status]
            const canChange = r.status === 'pending' || r.status === 'confirmed'
            const canPay = canChange && r.deposit_status === 'unpaid' && r.deposit_amount > 0
            return (
              <li
                key={r.reference_code}
                aria-label={`Reservation ${r.reference_code}`}
                className="border-brand-line rounded-lg border bg-white p-5 md:p-6"
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-brand-charcoal font-serif text-xl whitespace-nowrap md:text-2xl">
                    {r.reference_code}
                  </h2>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold tracking-[0.1em] uppercase ${status.className}`}
                  >
                    {status.text}
                  </span>
                </div>
                <dl className="mt-4 space-y-2 text-sm">
                  {[
                    ['Date', format(parseISO(r.reservation_date), 'EEE, MMMM d, yyyy')],
                    ['Time', formatTime(r.reservation_time)],
                    ['Guests', String(r.pax)],
                    ['Table', r.table_number ?? 'Not assigned yet'],
                    [
                      'Deposit',
                      r.deposit_amount > 0
                        ? `${peso(r.deposit_amount)} (${r.deposit_status === 'paid' ? 'paid' : 'not paid yet'})`
                        : 'None',
                    ],
                  ].map(([term, value]) => (
                    <div key={term} className="flex justify-between gap-4">
                      <dt className="text-brand-ink/70">{term}</dt>
                      <dd className="text-brand-charcoal text-right font-semibold">{value}</dd>
                    </div>
                  ))}
                </dl>
                {canChange && (
                  <div className="mt-5 space-y-3">
                    {canPay && (
                      <Link
                        to={`/reserve/payment?code=${r.reference_code}`}
                        aria-label={`Pay deposit for ${r.reference_code}`}
                        className={submitButton}
                      >
                        Pay Deposit
                      </Link>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        aria-label={`Reschedule ${r.reference_code}`}
                        onClick={() =>
                          navigate(`/reserve?reschedule=${r.reference_code}`, {
                            state: { mobile_number: account.mobile_number },
                          })
                        }
                        className={outlineButton}
                      >
                        Reschedule
                      </button>
                      <button
                        type="button"
                        aria-label={`Cancel ${r.reference_code}`}
                        disabled={cancel.isPending}
                        onClick={() => {
                          if (window.confirm('Cancel this reservation?'))
                            cancel.mutate(r.reference_code)
                        }}
                        className={outlineButton}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
