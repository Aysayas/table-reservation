import { useQuery } from '@tanstack/react-query'
import { addHours, format, parseISO } from 'date-fns'
import { CalendarDays, Check, Copy, MapPin } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { getReservationByCode } from '@/services/reservations'
import { getSettings } from '@/services/settings'

const primaryButton =
  'bg-brand-red hover:bg-brand-red/90 focus-visible:outline-brand-red block w-full rounded-sm py-4 text-center text-sm font-bold tracking-[0.15em] text-white uppercase transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2'
const darkButton =
  'bg-brand-charcoal border-brand-gold text-brand-gold hover:bg-brand-charcoal/90 focus-visible:outline-brand-red block w-full rounded-sm border py-4 text-center text-sm font-bold tracking-[0.15em] uppercase transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2'
const smallLabel = 'text-brand-ink/75 text-xs font-bold tracking-[0.15em] uppercase'
const actionCard =
  'border-brand-gold/50 text-brand-charcoal hover:bg-brand-cream focus-visible:outline-brand-red flex flex-col items-center gap-2 rounded-xl border bg-white py-4 text-sm font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2'
const icsTime = "yyyyMMdd'T'HHmmss"
const notch =
  'bg-brand-cream border-brand-gold/50 absolute top-1/2 size-6 -translate-y-1/2 rounded-full border'

export default function ReservationConfirmation() {
  const { code = '' } = useParams()
  const { data: reservation, isLoading } = useQuery({
    queryKey: ['reservation', code],
    queryFn: () => getReservationByCode(code),
  })
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: getSettings })

  if (isLoading) return null

  const copyCode = () => {
    navigator.clipboard
      .writeText(code)
      .then(() => toast.success('Code copied'))
      .catch(() => toast.error("Couldn't copy the code"))
  }

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

  const start = parseISO(`${reservation.reservation_date}T${reservation.reservation_time}`)
  const placeName = `${settings?.restaurant_name ?? ''} Hotel and Restaurant`

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
    { title: 'Check your SMS', text: 'Your booking details are in the text we just sent.' },
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
          <button
            type="button"
            onClick={copyCode}
            className="border-brand-gold/60 text-brand-charcoal hover:bg-brand-cream focus-visible:outline-brand-red mt-4 inline-flex items-center gap-2 rounded-full border px-5 py-2 text-xs font-bold tracking-[0.15em] uppercase transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <Copy className="size-4" strokeWidth={1.75} />
            Copy code
          </button>
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

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button type="button" onClick={downloadCalendar} className={actionCard}>
          <CalendarDays className="text-brand-red size-6" strokeWidth={1.5} />
          Calendar
        </button>
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(placeName)}`}
          target="_blank"
          rel="noreferrer"
          className={actionCard}
        >
          <MapPin className="text-brand-red size-6" strokeWidth={1.5} />
          Directions
        </a>
      </div>

      <section className="mt-12">
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

      <div className="mt-12 space-y-3">
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
