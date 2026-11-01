import { useQuery } from '@tanstack/react-query'
import { addHours, format, parseISO } from 'date-fns'
import { CalendarDays, Check, Copy, LoaderCircle, MapPin } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import SiteFooter from '@/components/SiteFooter'
import useAccount from '@/hooks/useAccount'
import usePaymentReturn from '@/hooks/usePaymentReturn'
import { directionsUrl } from '@/lib/maps'
import { reservationStatuses } from '@/lib/reservationStatus'
import { getReservationByCode } from '@/services/reservations'
import { getSettings } from '@/services/settings'

const primaryButton =
  'bg-brand-red hover:bg-brand-red/90 focus-visible:outline-brand-red block w-full rounded-sm py-4 text-center text-sm font-bold tracking-[0.15em] text-white uppercase transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2'
const darkButton =
  'bg-brand-charcoal border-brand-gold text-brand-gold hover:bg-brand-charcoal/90 focus-visible:outline-brand-red block w-full rounded-sm border py-4 text-center text-sm font-bold tracking-[0.15em] uppercase transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2'
const smallLabel = 'text-white/60 text-xs font-bold tracking-[0.15em] uppercase'
const actionCard =
  'border-brand-gold/50 text-brand-charcoal hover:bg-brand-cream focus-visible:outline-brand-red flex flex-col items-center gap-2 rounded-xl border bg-white py-4 text-sm font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2'
const icsTime = "yyyyMMdd'T'HHmmss"
const notch = 'bg-brand-cream absolute top-1/2 size-6 -translate-y-1/2 rounded-full'

export default function ReservationConfirmation() {
  const { code = '' } = useParams()
  const { data: account } = useAccount()
  const { data: reservation, isLoading } = useQuery({
    queryKey: ['reservation', code],
    queryFn: () => getReservationByCode(code),
    refetchInterval: (query) => {
      const current = query.state.data
      return current && current.deposit_status === 'unpaid' && current.deposit_amount > 0
        ? 5000
        : false
    },
  })
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: getSettings })
  const inactive = reservation?.status === 'cancelled' || reservation?.status === 'no_show'
  const needsDeposit =
    !!reservation &&
    !inactive &&
    reservation.deposit_amount > 0 &&
    reservation.deposit_status === 'unpaid'
  const { confirming, timedOut } = usePaymentReturn(code, !!reservation && !needsDeposit)

  if (isLoading) return null

  const copyCode = () => {
    navigator.clipboard
      .writeText(code)
      .then(() => toast.success('Code copied'))
      .catch(() => toast.error("Couldn't copy the code"))
  }

  if (!reservation) {
    return (
      <div className="bg-brand-cream min-h-[calc(100vh-4rem)] px-4 py-16 text-center md:py-24">
        <div className="md:mx-auto md:max-w-md">
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
      </div>
    )
  }

  const start = parseISO(`${reservation.reservation_date}T${reservation.reservation_time}`)

  const downloadCalendar = () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Vencios Garden//Reservation//EN',
      'BEGIN:VEVENT',
      `UID:${reservation.reference_code}@venciosgarden`,
      `DTSTAMP:${format(new Date(), icsTime)}`,
      `DTSTART:${format(start, icsTime)}`,
      `DTEND:${format(addHours(start, 2), icsTime)}`,
      `SUMMARY:Table reservation at ${settings?.restaurant_name ?? ''}`,
      `DESCRIPTION:Reference code ${reservation.reference_code}\\, ${reservation.pax} guests`,
      `LOCATION:${(settings?.address ?? '').replace(/,/g, '\\,')}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
    link.download = `${reservation.reference_code}.ics`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const nextSteps = [
    ...(needsDeposit
      ? [{ title: 'Pay your deposit', text: 'Your table is held once the deposit is paid.' }]
      : []),
    {
      title: 'Arrive and show your code',
      text: `Give ${reservation.reference_code} to our staff when you arrive.`,
    },
    { title: 'Scan and order', text: 'Scan the QR code on your table to see the menu and order.' },
  ]

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
    {
      label:
        reservation.deposit_status === 'paid'
          ? 'Deposit Paid'
          : needsDeposit
            ? 'Deposit Due'
            : 'Deposit',
      value: `₱${reservation.deposit_amount.toFixed(2)}`,
    },
  ]

  return (
    <>
      <div className="bg-brand-cream px-4 pt-12 pb-16 md:px-10 md:pt-16 md:pb-24">
        <div className="md:mx-auto md:max-w-5xl">
          <div className="text-center">
            {confirming ? (
              <div className="border-brand-gold text-brand-red mx-auto flex size-24 items-center justify-center rounded-full border bg-white">
                <LoaderCircle
                  aria-hidden="true"
                  className="size-11 motion-safe:animate-spin"
                  strokeWidth={1.5}
                />
              </div>
            ) : (
              !inactive &&
              !needsDeposit && (
                <div className="bg-brand-red mx-auto flex size-24 items-center justify-center rounded-full text-white">
                  <Check className="size-11" strokeWidth={2} />
                </div>
              )
            )}
            {!inactive && !confirming && (
              <p className="font-display text-brand-red mt-6 text-5xl">
                {needsDeposit ? 'Almost done' : 'Salamat!'}
              </p>
            )}
            <h1
              aria-live="polite"
              className={`text-brand-charcoal font-serif text-4xl leading-tight md:text-5xl ${confirming ? 'mt-6' : 'mt-1'}`}
            >
              {confirming ? (
                'Confirming your payment…'
              ) : needsDeposit ? (
                <>
                  Pay your deposit to <span className="text-brand-red">hold your table.</span>
                </>
              ) : reservation.status === 'cancelled' ? (
                <>
                  This reservation was <span className="text-brand-red">cancelled.</span>
                </>
              ) : reservation.status === 'no_show' ? (
                <>
                  This reservation was <span className="text-brand-red">missed.</span>
                </>
              ) : (
                <>
                  Your table is <span className="text-brand-red">reserved.</span>
                </>
              )}
            </h1>
            <span aria-hidden="true" className="bg-brand-gold mx-auto mt-4 block h-px w-16" />
            {confirming && (
              <p className="text-brand-ink/75 mt-6 text-sm">This usually takes a few seconds.</p>
            )}
            {needsDeposit && !confirming && (
              <div className="mt-6 md:mx-auto md:max-w-sm">
                {timedOut && (
                  <p className="text-brand-ink/75 mb-4 text-sm">
                    If you just paid, it can take a minute to show here. Refresh this page before
                    paying again.
                  </p>
                )}
                <Link
                  to={`/reserve/payment?code=${reservation.reference_code}`}
                  className={primaryButton}
                >
                  Pay Deposit
                </Link>
              </div>
            )}
          </div>

          <div className="md:mt-12 md:grid md:grid-cols-2 md:items-start md:gap-16">
            <div>
              <section className="bg-brand-charcoal relative mt-8 rounded-xl text-white md:mt-0">
                <div className="px-6 pt-6 pb-6 text-center">
                  <p className="text-brand-gold text-xs font-bold tracking-[0.3em] uppercase">
                    Reference Code
                  </p>
                  <p className="mt-2 font-serif text-4xl font-bold tracking-wide text-white">
                    {reservation.reference_code}
                  </p>
                  <button
                    type="button"
                    onClick={copyCode}
                    className="focus-visible:outline-brand-gold mt-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-xs font-bold tracking-[0.15em] text-white uppercase transition-colors duration-200 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    <Copy className="size-4" strokeWidth={1.75} />
                    Copy code
                  </button>
                </div>

                <div aria-hidden="true" className="relative">
                  <span className={`${notch} -left-3`} />
                  <div className="mx-6 border-t border-dashed border-white/25" />
                  <span className={`${notch} -right-3`} />
                </div>

                <div className="px-6 pt-5 pb-5">
                  <h2 className="sr-only">Details</h2>
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-5">
                    {details.map((detail) => (
                      <div key={detail.label}>
                        <dt className={smallLabel}>{detail.label}</dt>
                        <dd className="mt-1 font-semibold text-white tabular-nums">
                          {detail.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                    <p className={smallLabel}>Status</p>
                    <p
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold tracking-[0.15em] uppercase ${inactive ? 'bg-white/15 text-white' : reservation.status === 'pending' ? 'bg-brand-gold text-brand-charcoal' : 'bg-brand-green text-white'}`}
                    >
                      <span aria-hidden="true">●</span>
                      <span>{reservationStatuses[reservation.status].text}</span>
                    </p>
                  </div>
                </div>
              </section>

              {!inactive && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button type="button" onClick={downloadCalendar} className={actionCard}>
                    <CalendarDays className="text-brand-red size-6" strokeWidth={1.5} />
                    Calendar
                  </button>
                  <a
                    href={directionsUrl(settings?.restaurant_name)}
                    target="_blank"
                    rel="noreferrer"
                    className={actionCard}
                  >
                    <MapPin className="text-brand-red size-6" strokeWidth={1.5} />
                    Directions
                  </a>
                </div>
              )}
            </div>

            <div>
              {!inactive && (
                <section className="mt-12 md:mt-2">
                  <h2 className="text-brand-red text-xs font-bold tracking-[0.3em] uppercase">
                    What happens next
                  </h2>
                  <ol className="mt-6">
                    {nextSteps.map((step, index) => (
                      <li key={step.title} className="relative flex gap-4 pb-8 last:pb-0">
                        {index < nextSteps.length - 1 && (
                          <span
                            aria-hidden="true"
                            className="bg-brand-gold/60 absolute top-9 left-[17px] h-[calc(100%-2.25rem)] w-px"
                          />
                        )}
                        <span
                          className={`flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${index === 0 ? 'bg-brand-red text-white' : 'border-brand-gold text-brand-gold-deep border bg-white'}`}
                        >
                          {index + 1}
                        </span>
                        <div className="pt-1">
                          <p className="text-brand-charcoal font-semibold">{step.title}</p>
                          <p className="text-brand-ink/75 mt-1 text-sm leading-6">{step.text}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              <div className={`space-y-3 ${inactive ? 'mt-8 md:mt-0' : 'mt-12'}`}>
                <Link to="/" className={needsDeposit ? darkButton : primaryButton}>
                  Back to Home
                </Link>
                <Link
                  to={account ? '/my-reservations' : `/reservation?code=${code}`}
                  className={darkButton}
                >
                  Manage Reservation
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <SiteFooter />
    </>
  )
}
