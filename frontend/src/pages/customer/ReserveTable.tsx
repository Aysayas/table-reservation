import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { ArrowLeft, Minus, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import MobileInput from '@/components/MobileInput'
import useAccount from '@/hooks/useAccount'
import { formatTime } from '@/lib/hours'
import { cleanMobile, mobileSchema, toLocalMobile } from '@/lib/mobile'
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
  mobile_number: mobileSchema,
  email: z
    .string()
    .trim()
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Enter a valid email'),
  special_request: z.string().trim().max(255, 'Use 255 characters or less'),
})

type FormValues = z.infer<typeof schema>

const draftKey = 'reserve-draft'
type Draft = { special_request?: string }

function readDraft(): Draft {
  try {
    return JSON.parse(sessionStorage.getItem(draftKey) ?? '{}')
  } catch {
    return {}
  }
}

function writeDraft(draft: Draft | null) {
  try {
    if (draft) sessionStorage.setItem(draftKey, JSON.stringify(draft))
    else sessionStorage.removeItem(draftKey)
  } catch {
    return
  }
}

const telHref = (number: string) => `tel:${number.replace(/\s/g, '')}`

export default function ReserveTable() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const location = useLocation()
  const stateMobile = (location.state as { mobile_number?: string } | null)?.mobile_number
  const { data: account, isLoading: accountLoading } = useAccount()
  const code = params.get('reschedule')
  const [draft] = useState(() => (code ? {} : readDraft()))
  const {
    data: booking,
    isLoading: bookingLoading,
    isError: bookingFailed,
  } = useQuery({
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
      mobile_number: cleanMobile(stateMobile ?? ''),
      email: '',
      special_request: draft.special_request ?? '',
    },
  })

  const [date, pax, time] = useWatch({
    control,
    name: ['reservation_date', 'pax', 'reservation_time'],
  })
  const special_request = useWatch({ control, name: 'special_request' })
  const {
    data: slots = [],
    isFetched,
    isLoading: slotsLoading,
    isError: slotsFailed,
    refetch: refetchSlots,
  } = useQuery({
    queryKey: ['availability', date, pax],
    queryFn: () => getAvailability(date, pax),
    enabled: date >= today,
  })

  useEffect(() => {
    if (time && isFetched && !slotsFailed && !slots.some((s) => s.time === time && s.available)) {
      setValue('reservation_time', '')
    }
  }, [slots, isFetched, slotsFailed, time, setValue])

  useEffect(() => {
    if (code) return
    const next = new URLSearchParams(params)
    const choices = {
      date,
      pax: pax === 2 && !params.has('pax') ? '' : String(pax),
      time: time === `${timeParam}:00` ? timeParam : time,
    }
    for (const [key, value] of Object.entries(choices)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    if (next.toString() !== params.toString()) setParams(next, { replace: true })
  }, [code, date, pax, time, timeParam, params, setParams])

  useEffect(() => {
    if (!code) writeDraft({ special_request })
  }, [code, special_request])

  useEffect(() => {
    if (!account) return
    setValue('full_name', account.full_name)
    setValue('email', account.email)
    if (!stateMobile) setValue('mobile_number', cleanMobile(account.mobile_number))
  }, [account, stateMobile, setValue])

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
          mobile_number: toLocalMobile(values.mobile_number),
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
    try {
      const reservation = await createReservation({
        ...values,
        mobile_number: toLocalMobile(values.mobile_number),
        email: values.email || null,
        special_request: values.special_request || null,
      })
      writeDraft(null)
      navigate(`/reserve/payment?code=${reservation.reference_code}`, { replace: true })
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  const phone = settings?.contact_number
  const callUs = phone ? (
    <a href={telHref(phone)} className="text-brand-red font-bold whitespace-nowrap underline">
      {phone}
    </a>
  ) : (
    'the restaurant'
  )

  if (code ? bookingLoading : accountLoading) return null

  if (!code && !account) {
    return (
      <Navigate to={`/login?next=${encodeURIComponent(`/reserve${location.search}`)}`} replace />
    )
  }

  if (code && !booking) {
    return (
      <div className="bg-brand-cream min-h-[calc(100dvh-4rem)] px-4 pt-6 md:py-12">
        <div className="border-brand-line rounded-lg border bg-white p-5 text-center md:mx-auto md:max-w-md md:p-6">
          <h1 className="text-brand-charcoal font-serif text-2xl">
            {bookingFailed ? "We couldn't load your reservation" : 'Reservation not found'}
          </h1>
          <p className="text-brand-ink/75 mt-3 text-sm">
            {bookingFailed ? (
              <>Please try again in a moment, or call {callUs}.</>
            ) : (
              <>
                We couldn't find <span className="whitespace-nowrap">{code}</span>. Check your code
                and try again.
              </>
            )}
          </p>
          <Link
            to="/reservation"
            className="bg-brand-red hover:bg-brand-red/90 focus-visible:outline-brand-gold mt-6 block w-full rounded-sm py-4 text-center text-sm font-bold tracking-[0.15em] text-white uppercase transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Find My Reservation
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-brand-cream min-h-[calc(100dvh-4rem)] px-4 pt-6 md:py-12">
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
        {booking && (
          <p className="text-brand-charcoal mt-2 text-sm font-semibold">
            Currently: {format(parseISO(booking.reservation_date), 'EEE, MMM d')},{' '}
            {formatTime(booking.reservation_time)}, {booking.pax}{' '}
            {booking.pax === 1 ? 'guest' : 'guests'}
          </p>
        )}

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
                ) : slotsFailed ? (
                  <div role="alert" className="text-brand-ink/75 mt-2 text-sm">
                    <p>We couldn't load the times. Try again, or call {callUs}.</p>
                    <button
                      type="button"
                      onClick={() => refetchSlots()}
                      className="border-brand-charcoal text-brand-charcoal hover:bg-brand-charcoal mt-3 rounded-sm border px-5 py-2.5 text-sm font-bold transition-colors duration-200 hover:text-white"
                    >
                      Try Again
                    </button>
                  </div>
                ) : slotsLoading ? (
                  <p role="status" className="text-brand-ink/75 mt-2 text-sm">
                    Loading times…
                  </p>
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
                {isFetched && slots.length > 0 && !slots.some((s) => s.available) && (
                  <p className="text-brand-ink/75 mt-2 text-sm">
                    We can't seat {pax} {pax === 1 ? 'guest' : 'guests'} online on this day. Please
                    call us and we'll help you arrange it: {callUs}
                  </p>
                )}
                {errors.reservation_time && (
                  <p className={error}>{errors.reservation_time.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-6">
              {!code && account && (
                <p className="text-brand-charcoal text-sm">
                  Booking as <span className="font-bold">{account.full_name}</span>,{' '}
                  <span className="whitespace-nowrap">{account.mobile_number}</span>
                </p>
              )}
              <div className="hidden">
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
              <div className={code ? '' : 'hidden'}>
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
              <div className="hidden">
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

          <div className="bg-brand-cream/95 border-brand-line sticky bottom-0 -mx-4 mt-8 border-t px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:static md:mx-0 md:mt-10 md:border-0 md:bg-transparent md:p-0">
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
