import { zodResolver } from '@hookform/resolvers/zod'
import { format, parseISO } from 'date-fns'
import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import CancelReservationDialog from '@/components/CancelReservationDialog'
import LeaderRow from '@/components/LeaderRow'
import MobileInput from '@/components/MobileInput'
import { apiError } from '@/lib/api'
import { cleanMobile, mobileSchema, toLocalMobile } from '@/lib/mobile'
import { reservationStatuses } from '@/lib/reservationStatus'
import { cancelReservation, findReservation } from '@/services/reservations'
import type { PublicReservation } from '@/types/db'

const peso = (amount: number) =>
  `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const label = 'text-brand-charcoal text-xs font-bold tracking-label uppercase'
const field =
  'border-brand-line focus:border-brand-gold mt-2 w-full rounded-sm border bg-white px-4 py-3 text-sm outline-none placeholder:text-brand-ink/65'
const error = 'text-brand-red mt-1.5 text-xs'
const outlineButton =
  'border-brand-charcoal text-brand-charcoal hover:bg-brand-charcoal rounded-sm border py-3 text-sm font-bold tracking-label uppercase transition-colors duration-200 hover:text-white disabled:pointer-events-none disabled:opacity-40'

const schema = z.object({
  reference_code: z.string().trim().min(1, 'Enter your reference code'),
  mobile_number: mobileSchema,
})

type FormValues = z.infer<typeof schema>

export default function FindReservation() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const savedMobile = (useLocation().state as { mobile?: string } | null)?.mobile ?? ''
  const savedCode = params.get('code') ?? ''
  const [result, setResult] = useState<PublicReservation | null>()
  const [mobile, setMobile] = useState(savedMobile)
  const [cancelling, setCancelling] = useState(false)
  const [busy, setBusy] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { reference_code: savedCode, mobile_number: cleanMobile(savedMobile) },
  })

  const lookUp = async (code: string, local: string) => {
    try {
      const found = await findReservation(code, local)
      setMobile(local)
      setResult(found ?? null)
      setParams({ code }, { replace: true, state: { mobile: local } })
    } catch (e) {
      toast.error(apiError(e, "Couldn't look up the reservation. Please try again."))
    }
  }

  const onSubmit = ({ reference_code, mobile_number }: FormValues) =>
    lookUp(reference_code.toUpperCase(), toLocalMobile(mobile_number))

  useEffect(() => {
    if (!savedCode || !savedMobile) return
    let current = true
    findReservation(savedCode, savedMobile)
      .then((found) => {
        if (current) setResult(found ?? null)
      })
      .catch(() => undefined)
    return () => {
      current = false
    }
  }, [savedCode, savedMobile])

  const cancel = async () => {
    if (!result) return
    setBusy(true)
    try {
      setResult(await cancelReservation(result.reference_code, mobile))
      toast.success('Reservation cancelled')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't cancel the reservation")
    }
    setBusy(false)
    setCancelling(false)
  }

  const canChange = result?.status === 'pending' || result?.status === 'confirmed'
  const canPay = canChange && result?.deposit_status === 'unpaid' && result.deposit_amount > 0
  const status = result ? reservationStatuses[result.status] : undefined

  return (
    <div className="bg-brand-cream min-h-[calc(100dvh-4rem)] px-4 pt-6 pb-12 md:py-12">
      <div className="md:mx-auto md:max-w-xl">
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Back"
            onClick={() => navigate(-1)}
            className="border-brand-line text-brand-charcoal hover:border-brand-gold flex size-10 shrink-0 items-center justify-center rounded-full border bg-white transition-colors duration-200"
          >
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="text-brand-charcoal font-serif text-3xl md:text-4xl">
            Find My Reservation
          </h1>
        </div>

        <form noValidate onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          <div>
            <label htmlFor="reference_code" className={label}>
              Reference Code
            </label>
            <input
              id="reference_code"
              placeholder="RSV-000000"
              autoCapitalize="characters"
              aria-invalid={!!errors.reference_code}
              aria-describedby="reference_code_help"
              {...register('reference_code')}
              className={`${field} uppercase placeholder:normal-case`}
            />
            <p id="reference_code_help" className="text-brand-ink/75 mt-1.5 text-xs">
              It starts with RSV- and is on your confirmation page.
            </p>
            {errors.reference_code && (
              <p role="alert" className={error}>
                {errors.reference_code.message}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="mobile_number" className={label}>
              Mobile Number
            </label>
            <MobileInput
              id="mobile_number"
              invalid={!!errors.mobile_number}
              {...register('mobile_number')}
            />
            {errors.mobile_number && (
              <p role="alert" className={error}>
                {errors.mobile_number.message}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-brand-red hover:bg-brand-red/90 lift focus-visible:outline-brand-gold tracking-label block w-full rounded-sm py-4 text-sm font-bold text-white uppercase duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60"
          >
            Find Reservation
          </button>
        </form>

        {result === null && (
          <p
            role="alert"
            className="border-brand-red/30 bg-brand-red/5 text-brand-red mt-8 rounded-lg border px-4 py-3 text-sm"
          >
            We couldn't find a reservation with that code and mobile number.
          </p>
        )}

        {result && status && (
          <section className="border-brand-line mt-8 rounded-lg border bg-white p-5 motion-safe:animate-[rise_500ms_cubic-bezier(0.16,1,0.3,1)] md:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-brand-charcoal font-serif text-xl md:text-2xl">
                Reservation <span className="whitespace-nowrap">{result.reference_code}</span>
              </h2>
              <span
                className={`tracking-label shrink-0 rounded-full px-3 py-1 text-xs font-bold uppercase ${status.className}`}
              >
                {status.text}
              </span>
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              {[
                ['Name', result.customer.full_name],
                ['Date', format(parseISO(result.reservation_date), 'MMMM d, yyyy')],
                [
                  'Time',
                  format(
                    parseISO(`${result.reservation_date}T${result.reservation_time}`),
                    'h:mm a',
                  ),
                ],
                ['Guests', String(result.pax)],
                ['Table', result.table_number ?? 'Not assigned yet'],
                [
                  'Deposit',
                  result.deposit_amount > 0
                    ? `${peso(result.deposit_amount)} (${result.deposit_status === 'paid' ? 'paid' : 'not paid yet'})`
                    : 'None',
                ],
              ].map(([term, value]) => (
                <LeaderRow key={term} term={term}>
                  {value}
                </LeaderRow>
              ))}
            </dl>
            {canPay && (
              <Link
                to={`/reserve/payment?code=${result.reference_code}`}
                className="bg-brand-red hover:bg-brand-red/90 lift focus-visible:outline-brand-gold tracking-label mt-6 block w-full rounded-sm py-4 text-center text-sm font-bold text-white uppercase duration-200 focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                Pay Deposit
              </Link>
            )}
            <div className={`${canPay ? 'mt-3' : 'mt-6'} grid grid-cols-2 gap-3`}>
              <button
                type="button"
                disabled={!canChange}
                onClick={() =>
                  navigate(`/reserve?reschedule=${result.reference_code}`, {
                    state: { mobile_number: mobile },
                  })
                }
                className={outlineButton}
              >
                Reschedule
              </button>
              <button
                type="button"
                disabled={!canChange}
                onClick={() => setCancelling(true)}
                className={outlineButton}
              >
                Cancel
              </button>
            </div>
          </section>
        )}
        {result && cancelling && (
          <CancelReservationDialog
            reservation={result}
            busy={busy}
            onKeep={() => setCancelling(false)}
            onCancel={cancel}
          />
        )}
      </div>
    </div>
  )
}
