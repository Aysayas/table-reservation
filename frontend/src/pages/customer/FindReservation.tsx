import { zodResolver } from '@hookform/resolvers/zod'
import { format, parseISO } from 'date-fns'
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import MobileInput from '@/components/MobileInput'
import { apiError } from '@/lib/api'
import { mobileSchema, toLocalMobile } from '@/lib/mobile'
import { reservationStatuses } from '@/lib/reservationStatus'
import { cancelReservation, findReservation } from '@/services/reservations'
import type { PublicReservation } from '@/types/db'

const label = 'text-brand-charcoal text-xs font-bold tracking-[0.15em] uppercase'
const field =
  'border-brand-line focus:border-brand-gold mt-2 w-full rounded-sm border bg-white px-4 py-3 text-sm outline-none placeholder:text-brand-ink/50'
const error = 'text-brand-red mt-1.5 text-xs'
const outlineButton =
  'border-brand-charcoal text-brand-charcoal hover:bg-brand-charcoal rounded-sm border py-3 text-sm font-bold tracking-[0.1em] uppercase transition-colors duration-200 hover:text-white disabled:pointer-events-none disabled:opacity-40'

const schema = z.object({
  reference_code: z.string().trim().min(1, 'Enter your reference code'),
  mobile_number: mobileSchema,
})

type FormValues = z.infer<typeof schema>

export default function FindReservation() {
  const navigate = useNavigate()
  const [result, setResult] = useState<PublicReservation | null>()
  const [mobile, setMobile] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { reference_code: '', mobile_number: '' },
  })

  const onSubmit = async ({ reference_code, mobile_number }: FormValues) => {
    const local = toLocalMobile(mobile_number)
    try {
      const found = await findReservation(reference_code.toUpperCase(), local)
      setMobile(local)
      setResult(found ?? null)
    } catch (e) {
      toast.error(apiError(e, "Couldn't look up the reservation. Please try again."))
    }
  }

  const cancel = async () => {
    if (!result || !window.confirm('Cancel this reservation?')) return
    try {
      setResult(await cancelReservation(result.reference_code, mobile))
      toast.success('Reservation cancelled')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't cancel the reservation")
    }
  }

  const canChange = result?.status === 'pending' || result?.status === 'confirmed'
  const status = result ? reservationStatuses[result.status] : undefined

  return (
    <div className="bg-brand-cream min-h-[calc(100vh-4rem)] px-4 pt-6 pb-12 md:py-12">
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
              {...register('reference_code')}
              className={`${field} uppercase placeholder:normal-case`}
            />
            {errors.reference_code && <p className={error}>{errors.reference_code.message}</p>}
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
            {errors.mobile_number && <p className={error}>{errors.mobile_number.message}</p>}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-brand-red hover:bg-brand-red/90 focus-visible:outline-brand-gold block w-full rounded-sm py-4 text-sm font-bold tracking-[0.15em] text-white uppercase transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60"
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
          <section className="border-brand-line mt-8 rounded-lg border bg-white p-5 md:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-brand-charcoal font-serif text-xl md:text-2xl">
                Reservation <span className="whitespace-nowrap">{result.reference_code}</span>
              </h2>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold tracking-[0.1em] uppercase ${status.className}`}
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
              ].map(([term, value]) => (
                <div key={term} className="flex justify-between gap-4">
                  <dt className="text-brand-ink/70">{term}</dt>
                  <dd className="text-brand-charcoal text-right font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 grid grid-cols-2 gap-3">
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
                onClick={cancel}
                className={outlineButton}
              >
                Cancel
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
