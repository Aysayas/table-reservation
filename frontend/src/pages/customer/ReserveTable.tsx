import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ArrowLeft, Minus, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { formatTime } from '@/lib/hours'
import {
  createReservation,
  getAvailability,
  getReservationByCode,
  rescheduleReservation,
} from '@/services/reservations'
import { getSettings } from '@/services/settings'

const label = 'text-brand-charcoal text-xs font-bold tracking-[0.15em] uppercase'
const field =
  'border-brand-line focus:border-brand-gold mt-2 w-full rounded-sm border bg-white px-4 py-3 text-sm font-normal tracking-normal normal-case outline-none placeholder:text-brand-ink/50'
const error = 'text-brand-red mt-1.5 text-xs'
const steps = ['Details', 'Deposit', 'Confirm']

const schema = z.object({
  reservation_date: z
    .string()
    .min(1, 'Choose a date')
    .refine((d) => d >= format(new Date(), 'yyyy-MM-dd'), 'Choose today or a later date'),
  pax: z.number().int().min(1),
  reservation_time: z.string().min(1, 'Choose a time'),
  full_name: z
    .string()
    .trim()
    .min(1, 'Enter your full name')
    .max(100, 'Use 100 characters or less'),
  mobile_number: z
    .string()
    .refine(
      (v) => /^09\d{9}$/.test(v.replace(/\s/g, '')),
      'Enter a mobile number like 0912 345 6789',
    ),
  email: z
    .string()
    .trim()
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Enter a valid email'),
  special_request: z.string().trim().max(255, 'Use 255 characters or less'),
})

type FormValues = z.infer<typeof schema>

export default function ReserveTable() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { state } = useLocation()
  const code = params.get('reschedule')
  const { data: booking } = useQuery({
    queryKey: ['reservation', code],
    queryFn: () => getReservationByCode(code ?? ''),
    enabled: !!code,
  })
  const [today] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: getSettings })
  const maxPax = settings?.max_pax ?? 10
  const timeParam = params.get('time') ?? ''

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      reservation_date: params.get('date') ?? '',
      pax: Math.max(1, Math.floor(Number(params.get('pax'))) || 2),
      reservation_time: timeParam.length === 5 ? `${timeParam}:00` : timeParam,
      full_name: '',
      mobile_number: (state as { mobile_number?: string } | null)?.mobile_number ?? '',
      email: '',
      special_request: '',
    },
  })

  const [date, pax, time] = useWatch({
    control,
    name: ['reservation_date', 'pax', 'reservation_time'],
  })
  const { data: slots = [], isFetched } = useQuery({
    queryKey: ['availability', date, pax],
    queryFn: () => getAvailability(date, pax),
    enabled: date >= today,
  })

  useEffect(() => {
    if (time && isFetched && !slots.some((s) => s.time === time && s.available)) {
      setValue('reservation_time', '')
    }
  }, [slots, isFetched, time, setValue])

  useEffect(() => {
    if (pax > maxPax) setValue('pax', maxPax)
  }, [pax, maxPax, setValue])

  useEffect(() => {
    if (!booking) return
    setValue('pax', booking.pax)
    setValue('full_name', booking.customer.full_name)
  }, [booking, setValue])

  const setPax = (value: number) =>
    setValue('pax', Math.min(maxPax, Math.max(1, value)), { shouldValidate: true })

  const onSubmit = async (values: FormValues) => {
    if (code) {
      try {
        await rescheduleReservation(code, {
          mobile_number: values.mobile_number.replace(/s/g, ''),
          reservation_date: values.reservation_date,
          reservation_time: values.reservation_time,
        })
        toast.success('Your reservation was moved')
        navigate(`/reserve/confirmation/${code}`)
      } catch (e) {
        toast.error((e as Error).message)
      }
      return
    }
    const reservation = await createReservation({
      ...values,
      mobile_number: values.mobile_number.replace(/\s/g, ''),
      email: values.email || null,
      special_request: values.special_request || null,
    })
    navigate(`/reserve/payment?code=${reservation.reference_code}`)
  }

  return (
    <div className="bg-brand-cream min-h-[calc(100vh-4rem)] px-4 pt-6 md:py-12">
      <div className="md:mx-auto md:max-w-4xl">
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
            {code ? (
              <>
                Reschedule <span className="whitespace-nowrap">{code}</span>
              </>
            ) : (
              'Reserve a Table'
            )}
          </h1>
        </div>

        {code && (
          <p className="text-brand-ink/70 mt-4 text-sm">
            Pick a new date and time. Your guests and deposit stay the same.
          </p>
        )}

        <ol className={`mt-8 flex items-start ${code ? 'hidden' : ''}`}>
          {steps.map((step, index) => (
            <li
              key={step}
              aria-current={index === 0 ? 'step' : undefined}
              className="relative flex flex-1 flex-col items-center gap-2 text-xs font-semibold"
            >
              {index > 0 && (
                <span
                  aria-hidden="true"
                  className="bg-brand-line absolute top-4 right-[calc(50%+1.25rem)] left-[calc(-50%+1.25rem)] h-px"
                />
              )}
              <span
                className={`relative flex size-8 items-center justify-center rounded-full border text-xs font-bold ${index === 0 ? 'bg-brand-red border-brand-red text-white' : 'border-brand-line text-brand-ink/60 bg-white'}`}
              >
                {index + 1}
              </span>
              <span className={index === 0 ? 'text-brand-charcoal' : 'text-brand-ink/60'}>
                {step}
              </span>
            </li>
          ))}
        </ol>

        <form
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          className="md:border-brand-line mt-8 md:rounded-lg md:border md:bg-white md:p-10"
        >
          <div className="space-y-6 md:grid md:grid-cols-2 md:gap-10 md:space-y-0">
            <div className="space-y-6">
              <div>
                <label htmlFor="reservation_date" className={label}>
                  Date
                </label>
                <input
                  id="reservation_date"
                  type="date"
                  min={today}
                  aria-invalid={!!errors.reservation_date}
                  {...register('reservation_date')}
                  className={field}
                />
                {errors.reservation_date && (
                  <p className={error}>{errors.reservation_date.message}</p>
                )}
              </div>

              <div role="group" aria-labelledby="guests-label">
                <p id="guests-label" className={label}>
                  Number of Guests
                </p>
                <div className="border-brand-line mt-2 inline-flex items-center rounded-sm border bg-white">
                  <button
                    type="button"
                    aria-label="Fewer guests"
                    disabled={!!code || pax <= 1}
                    onClick={() => setPax(pax - 1)}
                    className="text-brand-charcoal hover:text-brand-red flex size-11 items-center justify-center disabled:opacity-40"
                  >
                    <Minus className="size-4" />
                  </button>
                  <output
                    aria-live="polite"
                    className="border-brand-line text-brand-charcoal w-12 border-x py-2.5 text-center font-semibold"
                  >
                    {pax}
                  </output>
                  <button
                    type="button"
                    aria-label="More guests"
                    disabled={!!code || pax >= maxPax}
                    onClick={() => setPax(pax + 1)}
                    className="text-brand-charcoal hover:text-brand-red flex size-11 items-center justify-center disabled:opacity-40"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
              </div>

              <div role="group" aria-labelledby="time-label">
                <p id="time-label" className={label}>
                  Available Time
                </p>
                {!date ? (
                  <p className="text-brand-ink/60 mt-2 text-sm">Choose a date to see the times.</p>
                ) : isFetched && slots.length === 0 ? (
                  <p className="text-brand-ink/60 mt-2 text-sm">No times left on this day.</p>
                ) : (
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {slots.map((slot) => {
                      const selected = slot.time === time
                      return (
                        <button
                          key={slot.time}
                          type="button"
                          aria-pressed={selected}
                          disabled={!slot.available}
                          onClick={() =>
                            setValue('reservation_time', slot.time, { shouldValidate: true })
                          }
                          className={`rounded-sm border py-3 text-sm font-semibold transition-colors duration-200 ${selected ? 'bg-brand-charcoal border-brand-charcoal text-white' : 'border-brand-line text-brand-charcoal hover:border-brand-gold bg-white'} disabled:text-brand-ink/40 disabled:border-dashed disabled:bg-transparent`}
                        >
                          {formatTime(slot.time)}
                        </button>
                      )
                    })}
                  </div>
                )}
                {errors.reservation_time && (
                  <p className={error}>{errors.reservation_time.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className={code ? 'hidden' : ''}>
                <label htmlFor="full_name" className={label}>
                  Full Name
                </label>
                <input
                  id="full_name"
                  autoComplete="name"
                  placeholder="Juan Dela Cruz"
                  aria-invalid={!!errors.full_name}
                  {...register('full_name')}
                  className={field}
                />
                {errors.full_name && <p className={error}>{errors.full_name.message}</p>}
              </div>
              <div>
                <label htmlFor="mobile_number" className={label}>
                  Mobile Number
                </label>
                <input
                  id="mobile_number"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="09XX XXX XXXX"
                  aria-invalid={!!errors.mobile_number}
                  {...register('mobile_number')}
                  className={field}
                />
                {errors.mobile_number && <p className={error}>{errors.mobile_number.message}</p>}
              </div>
              <div className={code ? 'hidden' : ''}>
                <label htmlFor="email" className={label}>
                  Email (optional)
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@email.com"
                  aria-invalid={!!errors.email}
                  {...register('email')}
                  className={field}
                />
                {errors.email && <p className={error}>{errors.email.message}</p>}
              </div>
              <div className={code ? 'hidden' : ''}>
                <label htmlFor="special_request" className={label}>
                  Special Request (optional)
                </label>
                <textarea
                  id="special_request"
                  rows={4}
                  aria-invalid={!!errors.special_request}
                  {...register('special_request')}
                  className={`${field} resize-none`}
                />
                {errors.special_request && (
                  <p className={error}>{errors.special_request.message}</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-brand-cream/95 border-brand-line sticky bottom-0 -mx-4 mt-8 border-t px-4 py-4 md:static md:mx-0 md:mt-10 md:border-0 md:bg-transparent md:p-0">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-brand-red hover:bg-brand-red/90 focus-visible:outline-brand-gold block w-full rounded-sm py-4 text-sm font-bold tracking-[0.15em] text-white uppercase transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60 md:ml-auto md:w-auto md:px-12"
            >
              {code ? 'Confirm New Time' : 'Continue to Deposit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
