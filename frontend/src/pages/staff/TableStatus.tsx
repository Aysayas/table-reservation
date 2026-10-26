import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNowStrict, parseISO } from 'date-fns'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { formatTime } from '@/lib/hours'
import { updateReservationStatus } from '@/services/reservations'
import { getTables, setTableStatus } from '@/services/tables'
import type { TableStatus as Status } from '@/types/db'

const peso = (amount: number) =>
  `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const cardButton =
  'border-brand-charcoal text-brand-charcoal hover:bg-brand-charcoal mt-4 block w-full rounded-md border bg-white py-2.5 text-center text-sm font-bold transition-colors duration-200 hover:text-white'

const look: Record<Status, { card: string; badge: string; text: string }> = {
  available: {
    card: 'border-brand-line bg-white',
    badge: 'border-brand-line text-brand-charcoal border bg-white',
    text: 'Available',
  },
  occupied: {
    card: 'border-brand-charcoal bg-brand-charcoal/5 border-2',
    badge: 'bg-brand-charcoal text-white',
    text: 'Occupied',
  },
  reserved: {
    card: 'border-brand-gold border-dashed bg-white border-2',
    badge: 'bg-brand-gold/20 text-brand-gold-deep',
    text: 'Reserved',
  },
}
const filters: (Status | 'all')[] = ['all', 'available', 'occupied', 'reserved']

export default function TableStatus() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<Status | 'all'>('all')
  const { data: tables = [] } = useQuery({
    queryKey: ['tables'],
    queryFn: () => getTables(),
    refetchInterval: 30000,
  })
  const arrive = useMutation({
    mutationFn: (reservation_id: number) =>
      updateReservationStatus(reservation_id, { status: 'arrived' }),
    onSuccess: (r) => {
      toast.success(`${r.reference_code} arrived at ${r.table_number}`)
      for (const key of ['tables', 'reservations', 'dashboard']) {
        queryClient.invalidateQueries({ queryKey: [key] })
      }
    },
    onError: (e) => toast.error(e.message),
  })

  const free = useMutation({
    mutationFn: (table_id: number) => setTableStatus(table_id, 'available'),
    onSuccess: (t) => {
      toast.success(`${t.table_number} is now available`)
      for (const key of ['tables', 'dashboard']) {
        queryClient.invalidateQueries({ queryKey: [key] })
      }
    },
    onError: (e) => toast.error(e.message),
  })

  const count = (f: Status | 'all') =>
    f === 'all' ? tables.length : tables.filter((t) => t.status === f).length
  const shown = filter === 'all' ? tables : tables.filter((t) => t.status === filter)

  return (
    <div>
      <div role="group" aria-label="Filter tables" className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors duration-200 ${filter === f ? 'bg-brand-charcoal border-brand-charcoal text-white' : 'border-brand-line text-brand-charcoal hover:border-brand-gold bg-white'}`}
          >
            {f === 'all' ? 'All' : look[f].text} ({count(f)})
          </button>
        ))}
      </div>

      <ul className="mt-6 grid grid-cols-2 gap-5 lg:grid-cols-3 xl:grid-cols-4">
        {shown.map((t) => (
          <li
            key={t.table_id}
            aria-label={`Table ${t.table_number}`}
            className={`flex min-h-52 flex-col rounded-lg p-5 ${look[t.status].card}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-brand-charcoal font-serif text-2xl font-bold">
                  Table {t.table_number}
                </h2>
                <p className="text-brand-ink/60 text-sm">{t.capacity} seats</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${look[t.status].badge}`}>
                {look[t.status].text}
              </span>
            </div>

            <div className="mt-5 flex flex-1 flex-col justify-end text-sm">
              {t.status === 'available' && (
                <p className="text-brand-ink/60 mb-auto">Ready for guests</p>
              )}

              {t.status === 'occupied' &&
                (t.current_order ? (
                  <>
                    <p className="text-brand-charcoal font-semibold">
                      Order #{t.current_order.order_id} · {peso(t.current_order.total_amount)}
                    </p>
                    <p className="text-brand-ink/60 mt-1">
                      Seated{' '}
                      {formatDistanceToNowStrict(parseISO(t.current_order.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                    <Link
                      to={`/staff/orders?order=${t.current_order.order_id}`}
                      className={cardButton}
                    >
                      View Order
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="text-brand-ink/60 mb-auto">No unpaid or unserved order</p>
                    <button
                      type="button"
                      disabled={free.isPending}
                      onClick={() => free.mutate(t.table_id)}
                      className={cardButton}
                    >
                      Free Table
                    </button>
                  </>
                ))}

              {t.status === 'reserved' &&
                (t.next_reservation ? (
                  <>
                    <p className="text-brand-charcoal font-semibold">
                      {t.next_reservation.full_name} ·{' '}
                      {formatTime(t.next_reservation.reservation_time)}
                    </p>
                    <p className="text-brand-ink/60 mt-1">{t.next_reservation.reference_code}</p>
                    <button
                      type="button"
                      disabled={arrive.isPending}
                      onClick={() => arrive.mutate(t.next_reservation!.reservation_id)}
                      className={cardButton}
                    >
                      Mark Arrived
                    </button>
                  </>
                ) : (
                  <p className="text-brand-ink/60 mb-auto">No booking left today</p>
                ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
