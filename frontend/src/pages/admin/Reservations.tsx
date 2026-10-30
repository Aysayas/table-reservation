import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { formatTime } from '@/lib/hours'
import { listReservations, type ReservationView } from '@/services/reservations'
import { getOpeningHours, getSettings, updateSettings } from '@/services/settings'
import EditReservationDialog from '@/components/EditReservationDialog'
import type { PublicReservation, ReservationStatus } from '@/types/db'

const th = 'text-brand-ink/70 px-3 py-3 text-left text-xs font-bold tracking-[0.1em] uppercase'
const td = 'text-brand-charcoal px-3 py-3 text-sm whitespace-nowrap'
const label = 'text-brand-charcoal block text-sm font-bold'
const field =
  'border-brand-line focus:border-brand-gold mt-2 block w-full rounded-md border bg-white px-4 py-3 text-sm font-normal outline-none disabled:bg-brand-cream/60 disabled:text-brand-ink/50'
const error = 'text-brand-red mt-1.5 text-xs'

const statusBadge: Record<ReservationStatus, string> = {
  pending: 'bg-brand-gold/20 text-brand-gold-deep',
  confirmed: 'bg-brand-green/10 text-brand-green',
  arrived: 'bg-brand-charcoal text-white',
  no_show: 'bg-brand-ink/10 text-brand-ink',
  cancelled: 'bg-brand-red/10 text-brand-red',
}
const statusText: Record<ReservationStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  arrived: 'Arrived',
  no_show: 'No-show',
  cancelled: 'Cancelled',
}
const views: { value: ReservationView; label: string }[] = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'today', label: 'Today' },
  { value: 'past', label: 'Past' },
  { value: 'cancelled', label: 'Cancelled' },
]
const slotLengths = [15, 30, 45, 60, 90, 120, 180, 240]

const schema = z.object({
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

const halfHours = Array.from(
  { length: 33 },
  (_, i) => `${String(6 + Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`,
)

type FormValues = z.infer<typeof schema>

export default function Reservations() {
  const queryClient = useQueryClient()
  const [view, setView] = useState<ReservationView>('upcoming')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<PublicReservation | null>(null)
  const { data } = useQuery({
    queryKey: ['reservations', { view, status: '', search: '', page }],
    queryFn: () => listReservations({ view, status: '', search: '', page }),
  })
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: getSettings })
  const { data: hours = [] } = useQuery({ queryKey: ['opening-hours'], queryFn: getOpeningHours })
  const [weekday] = useState(() => new Date().getDay())
  const today = hours.find((h) => h.day_of_week === weekday)
  const openTime = settings?.booking_open_time?.slice(0, 5)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: settings && {
      slot_minutes: settings.slot_minutes,
      max_pax: settings.max_pax,
      booking_open_time: settings.booking_open_time?.slice(0, 5) ?? '',
      deposit_required: settings.deposit_required,
      deposit_per_guest: settings.deposit_per_guest,
    },
  })
  const depositOn = useWatch({ control, name: 'deposit_required' })

  const onSubmit = async (values: FormValues) => {
    try {
      await updateSettings({ ...values, booking_open_time: values.booking_open_time || null })
      toast.success('Settings saved')
      for (const key of ['settings', 'availability']) {
        queryClient.invalidateQueries({ queryKey: [key] })
      }
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  const rows = data?.data ?? []
  const total = data?.meta.total ?? 0
  const pages = Math.max(1, Math.ceil(total / 8))
  const first = total ? (page - 1) * 8 + 1 : 0

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[1fr_19rem]">
      <div className="min-w-0">
        <div role="group" aria-label="Reservation view" className="flex flex-wrap gap-2">
          {views.map((v) => (
            <button
              key={v.value}
              type="button"
              aria-pressed={view === v.value}
              onClick={() => {
                setView(v.value)
                setPage(1)
              }}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors duration-200 ${view === v.value ? 'bg-brand-charcoal border-brand-charcoal text-white' : 'border-brand-line text-brand-charcoal hover:border-brand-gold bg-white'}`}
            >
              {v.label}
            </button>
          ))}
        </div>

        <div className="border-brand-line mt-6 overflow-x-auto rounded-lg border bg-white">
          <table className="w-full">
            <thead className="bg-brand-cream/60">
              <tr>
                {['Ref Code', 'Date', 'Time', 'Name', 'Guests', 'Status'].map((h) => (
                  <th key={h} className={th}>
                    {h}
                  </th>
                ))}
                <th className={th}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.reservation_id} className="border-brand-line border-t">
                  <td className={`${td} font-semibold`}>{r.reference_code}</td>
                  <td className={`${td} whitespace-nowrap`}>
                    {format(parseISO(r.reservation_date), 'EEE, MMM d, yyyy')}
                  </td>
                  <td className={`${td} tabular-nums`}>{formatTime(r.reservation_time)}</td>
                  <td className={td}>{r.customer.full_name}</td>
                  <td className={td}>{r.pax}</td>
                  <td className={td}>
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${statusBadge[r.status]}`}
                    >
                      {statusText[r.status]}
                    </span>
                  </td>
                  <td className={`${td} text-right`}>
                    {(r.status === 'pending' || r.status === 'confirmed') && (
                      <button
                        type="button"
                        aria-label={`Edit ${r.reference_code}`}
                        onClick={() => setEditing(r)}
                        className="border-brand-charcoal text-brand-charcoal hover:bg-brand-charcoal rounded-md border px-3 py-1.5 text-xs font-bold transition-colors duration-200 hover:text-white"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-brand-ink/60 px-4 py-10 text-center text-sm">
                    No reservations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-brand-ink/70 text-sm">
            Showing {first}–{Math.min(page * 8, total)} of {total}
          </p>
          <nav aria-label="Pages" className="flex gap-2">
            <button
              type="button"
              aria-label="Previous page"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="border-brand-line flex size-9 items-center justify-center rounded-md border bg-white disabled:opacity-40"
            >
              <ChevronLeft className="size-4" />
            </button>
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                aria-current={n === page ? 'page' : undefined}
                onClick={() => setPage(n)}
                className={`flex size-9 items-center justify-center rounded-md border text-sm font-semibold ${n === page ? 'bg-brand-charcoal border-brand-charcoal text-white' : 'border-brand-line bg-white'}`}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              aria-label="Next page"
              disabled={page >= pages}
              onClick={() => setPage(page + 1)}
              className="border-brand-line flex size-9 items-center justify-center rounded-md border bg-white disabled:opacity-40"
            >
              <ChevronRight className="size-4" />
            </button>
          </nav>
        </div>
      </div>

      <section
        aria-labelledby="settings-title"
        className="border-brand-line rounded-lg border bg-white p-6"
      >
        <h2 id="settings-title" className="text-brand-charcoal font-serif text-xl font-bold">
          Reservation Settings
        </h2>
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-5">
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
            <p className="text-brand-ink/60 mt-1.5 text-xs">
              The first booking time each day. Times before opening still start at opening.{' '}
              <Link to="/admin/settings" className="text-brand-red font-bold hover:underline">
                Set the hours in Settings
              </Link>
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
              className={field}
            />
            {errors.deposit_per_guest && (
              <p className={error}>{errors.deposit_per_guest.message}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-brand-red hover:bg-brand-red/90 block w-full rounded-md py-3 text-sm font-bold text-white transition-colors duration-200 disabled:opacity-60"
          >
            Save Settings
          </button>
        </form>
      </section>

      {editing && <EditReservationDialog reservation={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}
