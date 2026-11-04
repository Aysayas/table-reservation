import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import Modal from '@/components/Modal'
import Spinner from '@/components/Spinner'
import { formatTime } from '@/lib/hours'
import { getAvailability, updateReservation } from '@/services/reservations'
import { getTables, getTakenTables } from '@/services/tables'
import type { PublicReservation } from '@/types/db'

const label = 'text-brand-charcoal block text-sm font-bold'
const field =
  'border-brand-line focus:border-brand-gold mt-2 block w-full rounded-lg border bg-white px-4 py-3 text-sm font-normal outline-none'
const error = 'text-brand-red mt-1.5 text-xs'

const schema = z.object({
  reservation_date: z.string().min(1, 'Choose a date'),
  reservation_time: z.string().min(1, 'Choose a time'),
  pax: z
    .number({ error: 'Enter the number of guests' })
    .int('Use a whole number')
    .min(1, 'At least 1 guest'),
  table_id: z.number(),
})

type FormValues = z.infer<typeof schema>

type Props = { reservation: PublicReservation; onClose: () => void }

export default function EditReservationDialog({ reservation, onClose }: Props) {
  const queryClient = useQueryClient()
  const [today] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      reservation_date: reservation.reservation_date,
      reservation_time: reservation.reservation_time,
      pax: reservation.pax,
      table_id: reservation.table_id ?? 0,
    },
  })
  const [date, pax, time] = useWatch({
    control,
    name: ['reservation_date', 'pax', 'reservation_time'],
  })
  const { data: slots = [] } = useQuery({
    queryKey: ['availability', date, pax],
    queryFn: () => getAvailability(date, pax || 1),
    enabled: date >= today,
  })
  const { data: tables = [] } = useQuery({ queryKey: ['tables'], queryFn: () => getTables() })
  const { data: taken = [] } = useQuery({
    queryKey: ['tables', 'taken', date, time, reservation.reservation_id],
    queryFn: () => getTakenTables(date, time, reservation.reservation_id),
    enabled: !!date && !!time,
  })
  const times =
    slots.some((s) => s.time === time) || !time ? slots : [...slots, { time, available: true }]

  const onSubmit = async (values: FormValues) => {
    try {
      const saved = await updateReservation(reservation.reservation_id, {
        ...values,
        table_id: values.table_id || null,
      })
      toast.success(`${saved.reference_code} updated`)
      for (const key of ['reservations', 'tables', 'availability', 'dashboard']) {
        queryClient.invalidateQueries({ queryKey: [key] })
      }
      onClose()
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  return (
    <Modal title={`Edit ${reservation.reference_code}`} onClose={onClose}>
      <p className="text-brand-ink/70 -mt-2 text-center text-sm">
        {reservation.customer.full_name}
      </p>
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="edit_date" className={label}>
              Date
            </label>
            <input
              id="edit_date"
              type="date"
              min={today}
              aria-invalid={!!errors.reservation_date}
              {...register('reservation_date')}
              className={field}
            />
            {errors.reservation_date && <p className={error}>{errors.reservation_date.message}</p>}
          </div>
          <div>
            <label htmlFor="edit_time" className={label}>
              Time
            </label>
            <select
              id="edit_time"
              aria-invalid={!!errors.reservation_time}
              {...register('reservation_time')}
              className={field}
            >
              <option value="">Choose a time</option>
              {times.map((s) => (
                <option key={s.time} value={s.time}>
                  {formatTime(s.time)}
                  {s.available ? '' : ' (full)'}
                </option>
              ))}
            </select>
            {errors.reservation_time && <p className={error}>{errors.reservation_time.message}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="edit_pax" className={label}>
              Guests
            </label>
            <input
              id="edit_pax"
              type="number"
              min="1"
              step="1"
              aria-invalid={!!errors.pax}
              {...register('pax', { valueAsNumber: true })}
              className={field}
            />
            {errors.pax && <p className={error}>{errors.pax.message}</p>}
          </div>
          <div>
            <label htmlFor="edit_table" className={label}>
              Table
            </label>
            <select
              id="edit_table"
              {...register('table_id', { valueAsNumber: true })}
              className={field}
            >
              <option value={0}>No table yet</option>
              {tables.map((t) => (
                <option
                  key={t.table_id}
                  value={t.table_id}
                  disabled={t.capacity < (pax || 1) || taken.includes(t.table_id)}
                >
                  {t.table_number} · {taken.includes(t.table_id) ? 'booked' : `${t.capacity} seats`}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="border-brand-line text-brand-charcoal rounded-lg border px-4 py-2 text-sm font-bold disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            className="bg-brand-red hover:bg-brand-red/90 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            {isSubmitting && <Spinner />}
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  )
}
