import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import MobileInput from '@/components/MobileInput'
import { dayNames, formatTime, weekOrder } from '@/lib/hours'
import { cleanMobile, mobileSchema, toLocalMobile } from '@/lib/mobile'
import {
  getOpeningHours,
  getSettings,
  updateOpeningHours,
  updateSettings,
  uploadLogo,
} from '@/services/settings'

const card = 'border-brand-line rounded-xl border bg-white p-6 shadow-sm'
const heading = 'text-brand-charcoal font-serif text-xl font-bold'
const label = 'text-brand-charcoal block text-sm font-bold'
const field =
  'border-brand-line focus:border-brand-gold mt-2 block w-full rounded-md border bg-white px-4 py-3 text-sm font-normal outline-none placeholder:text-brand-ink/50'
const timeField =
  'border-brand-line focus:border-brand-gold min-w-0 flex-1 rounded-md border bg-white px-2.5 py-2 text-sm outline-none'
const error = 'text-brand-red mt-1.5 text-xs'

const day = z
  .object({
    day_of_week: z.number(),
    is_open: z.boolean(),
    open_time: z.string(),
    close_time: z.string(),
  })
  .refine((d) => !d.is_open || (d.open_time && d.close_time && d.open_time < d.close_time), {
    message: 'Closing time must be after opening time',
    path: ['close_time'],
  })

const schema = z.object({
  restaurant_name: z
    .string()
    .trim()
    .min(1, 'Enter the restaurant name')
    .max(100, 'Use 100 characters or less'),
  address: z.string().trim().max(255, 'Use 255 characters or less'),
  contact_number: z.union([z.literal(''), mobileSchema]),
  email: z.union([z.literal(''), z.email('Enter a valid email')]),
  facebook_url: z.string().trim().max(255, 'Use 255 characters or less'),
  hours: z.array(day),
  slot_minutes: z.number(),
  max_pax: z
    .number({ error: 'Enter the max guests' })
    .int('Use a whole number')
    .min(1, 'At least 1 guest')
    .max(100, 'At most 100 guests'),
  booking_open_time: z.string(),
  deposit_required: z.boolean(),
  deposit_per_guest: z.number({ error: 'Enter a deposit amount' }).min(0, 'Use 0 or more'),
})

const slotLengths = [15, 30, 45, 60, 90, 120, 180, 240]
const halfHours = Array.from(
  { length: 33 },
  (_, i) => `${String(6 + Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`,
)

type FormValues = z.infer<typeof schema>

const time = (t: string | null) => t?.slice(0, 5) ?? ''
const phone = (d: string) => `${toLocalMobile(d).slice(0, 4)} ${d.slice(3, 6)} ${d.slice(6)}`

export default function Settings() {
  const queryClient = useQueryClient()
  const fileInput = useRef<HTMLInputElement>(null)
  const [logo, setLogo] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: getSettings })
  const { data: hours } = useQuery({ queryKey: ['opening-hours'], queryFn: getOpeningHours })

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values:
      settings && hours
        ? {
            restaurant_name: settings.restaurant_name,
            address: settings.address ?? '',
            contact_number: cleanMobile(settings.contact_number ?? ''),
            email: settings.email ?? '',
            facebook_url: settings.facebook_url ?? '',
            slot_minutes: settings.slot_minutes,
            max_pax: settings.max_pax,
            booking_open_time: settings.booking_open_time?.slice(0, 5) ?? '',
            deposit_required: settings.deposit_required,
            deposit_per_guest: settings.deposit_per_guest,
            hours: weekOrder.map((d) => {
              const h = hours.find((x) => x.day_of_week === d)
              return {
                day_of_week: d,
                is_open: h?.is_open ?? false,
                open_time: time(h?.open_time ?? null),
                close_time: time(h?.close_time ?? null),
              }
            }),
          }
        : undefined,
  })
  const days = useWatch({ control, name: 'hours' }) ?? []
  const depositOn = useWatch({ control, name: 'deposit_required' })
  const [weekday] = useState(() => new Date().getDay())
  const today = hours?.find((h) => h.day_of_week === weekday)
  const openTime = settings?.booking_open_time?.slice(0, 5)

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview)
    },
    [preview],
  )

  const pick = (file: File | undefined) => {
    if (!file) return
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast.error('Use a PNG or JPG logo')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Use a logo up to 2 MB')
      return
    }
    setLogo(file)
    setPreview(URL.createObjectURL(file))
  }

  const onSubmit = async ({
    hours: week,
    contact_number,
    booking_open_time,
    ...info
  }: FormValues) => {
    try {
      await updateSettings({
        ...info,
        contact_number: contact_number ? phone(contact_number) : '',
        booking_open_time: booking_open_time || null,
      })
      await updateOpeningHours(
        week.map((d) => ({
          ...d,
          open_time: d.open_time || null,
          close_time: d.close_time || null,
        })),
      )
      if (logo) {
        await uploadLogo(logo)
        setLogo(null)
      }
      toast.success('Settings saved')
      for (const key of ['settings', 'opening-hours', 'availability']) {
        queryClient.invalidateQueries({ queryKey: [key] })
      }
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  const shownLogo = preview ?? settings?.logo_url ?? '/logo.png'

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="grid items-start gap-6 xl:grid-cols-[1fr_34rem]"
    >
      <section aria-labelledby="info-title" className={card}>
        <h2 id="info-title" className={heading}>
          Restaurant Information
        </h2>
        <div className="mt-5 space-y-5">
          <div>
            <label htmlFor="restaurant_name" className={label}>
              Restaurant Name
            </label>
            <input
              id="restaurant_name"
              aria-invalid={!!errors.restaurant_name}
              {...register('restaurant_name')}
              className={field}
            />
            {errors.restaurant_name && <p className={error}>{errors.restaurant_name.message}</p>}
          </div>
          <div>
            <label htmlFor="address" className={label}>
              Address
            </label>
            <input
              id="address"
              placeholder="Street, City, Province"
              aria-invalid={!!errors.address}
              {...register('address')}
              className={field}
            />
            {errors.address && <p className={error}>{errors.address.message}</p>}
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="contact_number" className={label}>
                Contact Number
              </label>
              <MobileInput
                id="contact_number"
                invalid={!!errors.contact_number}
                {...register('contact_number')}
                className="rounded-md"
              />
              {errors.contact_number && <p className={error}>{errors.contact_number.message}</p>}
            </div>
            <div>
              <label htmlFor="email" className={label}>
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="info@placeholder-domain.com"
                aria-invalid={!!errors.email}
                {...register('email')}
                className={field}
              />
              {errors.email && <p className={error}>{errors.email.message}</p>}
            </div>
          </div>
          <div>
            <label htmlFor="facebook_url" className={label}>
              Facebook Page
            </label>
            <input
              id="facebook_url"
              placeholder="facebook.com/placeholder-page"
              aria-invalid={!!errors.facebook_url}
              {...register('facebook_url')}
              className={field}
            />
            {errors.facebook_url && <p className={error}>{errors.facebook_url.message}</p>}
          </div>
          <div>
            <p className={label}>Logo</p>
            <div className="mt-2 flex items-center gap-5">
              <div className="border-brand-line bg-brand-cream/60 flex size-24 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed p-2">
                <img src={shownLogo} alt="Logo preview" className="max-h-full object-contain" />
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="border-brand-charcoal text-brand-charcoal hover:bg-brand-charcoal rounded-md border px-5 py-2.5 text-sm font-bold transition-colors duration-200 hover:text-white"
                >
                  Upload Logo
                </button>
                <p className="text-brand-ink/70 mt-2 text-xs">
                  {logo
                    ? `${logo.name}, saved when you click Save Changes`
                    : 'PNG or JPG, up to 2 MB'}
                </p>
              </div>
              <input
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png"
                aria-label="Logo file"
                className="hidden"
                onChange={(e) => {
                  pick(e.target.files?.[0])
                  e.target.value = ''
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="hours-title" className={card}>
        <h2 id="hours-title" className={heading}>
          Opening Hours
        </h2>
        <ul className="mt-5 space-y-3">
          {days.map((d, i) => {
            const name = dayNames[d.day_of_week]
            const closeError = errors.hours?.[i]?.close_time?.message
            return (
              <li key={d.day_of_week}>
                <div className="grid grid-cols-[1fr_auto] items-center gap-3 sm:grid-cols-[6rem_1fr_auto]">
                  <span className="text-brand-charcoal text-sm font-semibold">{name}</span>
                  <div
                    className={`col-span-2 row-start-2 flex min-w-0 items-center gap-2 transition-opacity duration-200 sm:col-span-1 sm:row-start-auto ${d.is_open ? '' : 'opacity-40'}`}
                  >
                    <input
                      type="time"
                      aria-label={`${name} opens`}
                      {...register(`hours.${i}.open_time`)}
                      className={timeField}
                    />
                    <span className="text-brand-ink/70">–</span>
                    <input
                      type="time"
                      aria-label={`${name} closes`}
                      aria-invalid={!!closeError}
                      {...register(`hours.${i}.close_time`)}
                      className={timeField}
                    />
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={d.is_open}
                    aria-label={`${name} open`}
                    onClick={() => setValue(`hours.${i}.is_open`, !d.is_open)}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${d.is_open ? 'bg-brand-green' : 'bg-brand-ink/20'}`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform duration-200 ${d.is_open ? 'translate-x-5' : ''}`}
                    />
                  </button>
                </div>
                {closeError && <p className={`${error} pl-27`}>{closeError}</p>}
              </li>
            )
          })}
        </ul>
        <p className="text-brand-ink/70 mt-5 text-xs">Toggle off to mark a day as closed.</p>
      </section>

      <section aria-labelledby="settings-title" className={card}>
        <h2 id="settings-title" className={heading}>
          Reservation Settings
        </h2>
        <div className="mt-5 space-y-5">
          <div>
            <label htmlFor="opening_time" className={label}>
              Opening Time for Booking
            </label>
            <select id="opening_time" {...register('booking_open_time')} className={field}>
              <option value="">
                Same as opening hours
                {today?.is_open && today.open_time
                  ? ` (${formatTime(today.open_time)} today)`
                  : ' (closed today)'}
              </option>
              {[...new Set([...halfHours, ...(openTime ? [openTime] : [])])].sort().map((t) => (
                <option key={t} value={t}>
                  {formatTime(t)}
                </option>
              ))}
            </select>
            <p className="text-brand-ink/70 mt-1.5 text-xs">
              The first booking time each day. Times before opening still start at opening.
            </p>
          </div>
          <div>
            <label htmlFor="slot_minutes" className={label}>
              Time Slot Length
            </label>
            <select
              id="slot_minutes"
              {...register('slot_minutes', { valueAsNumber: true })}
              className={field}
            >
              {slotLengths.map((m) => (
                <option key={m} value={m}>
                  {m} minutes
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="max_pax" className={label}>
              Max Guests per Booking
            </label>
            <input
              id="max_pax"
              type="number"
              min="1"
              max="100"
              step="1"
              aria-invalid={!!errors.max_pax}
              {...register('max_pax', { valueAsNumber: true })}
              className={field}
            />
            {errors.max_pax && <p className={error}>{errors.max_pax.message}</p>}
          </div>
          <div className="flex items-center justify-between gap-3">
            <p id="deposit-label" className={label}>
              Require Deposit
            </p>
            <button
              type="button"
              role="switch"
              aria-checked={!!depositOn}
              aria-labelledby="deposit-label"
              onClick={() => setValue('deposit_required', !depositOn)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${depositOn ? 'bg-brand-green' : 'bg-brand-ink/20'}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform duration-200 ${depositOn ? 'translate-x-5' : ''}`}
              />
            </button>
          </div>
          <div>
            <label htmlFor="deposit_per_guest" className={label}>
              Deposit Amount (₱) per guest
            </label>
            <input
              id="deposit_per_guest"
              type="number"
              min="0"
              step="0.01"
              disabled={!depositOn}
              aria-invalid={!!errors.deposit_per_guest}
              {...register('deposit_per_guest', { valueAsNumber: true })}
              className={`${field} disabled:bg-brand-cream/60 disabled:text-brand-ink/50`}
            />
            {errors.deposit_per_guest && (
              <p className={error}>{errors.deposit_per_guest.message}</p>
            )}
          </div>
        </div>
      </section>

      <div className="bg-brand-cream border-brand-line short:static short:mx-0 short:border-0 short:px-0 sticky bottom-0 z-10 -mx-4 flex justify-end border-t px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 xl:col-span-2">
        <button
          type="submit"
          disabled={isSubmitting || !settings}
          className="bg-brand-red hover:bg-brand-red/90 rounded-md px-6 py-3 text-sm font-bold text-white transition-colors duration-200 disabled:opacity-60"
        >
          Save Changes
        </button>
      </div>
    </form>
  )
}
