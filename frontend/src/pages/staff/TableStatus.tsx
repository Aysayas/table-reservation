import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNowStrict, parseISO } from 'date-fns'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import LoadError from '@/components/LoadError'
import Skeleton from '@/components/Skeleton'
import Spinner from '@/components/Spinner'
import { formatTime } from '@/lib/hours'
import { updateReservationStatus } from '@/services/reservations'
import { getTables, setTableStatus } from '@/services/tables'
import type { TableStatus as Status } from '@/types/db'
import useStatusFlash from '@/hooks/useStatusFlash'

const peso = (amount: number) =>
  `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const cardButton =
  'border-brand-charcoal text-brand-charcoal hover:bg-brand-charcoal mt-4 flex w-full items-center justify-center gap-2 rounded-lg border bg-white py-2.5 text-center text-sm font-bold transition-colors duration-200 hover:text-white'

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
  const {
    data = [],
    isPending,
    isLoadingError,
    refetch,
  } = useQuery({
    queryKey: ['tables'],
    queryFn: () => getTables(),
    refetchInterval: 30000,
  })
  const tables = data.map((t) =>
    t.status !== 'available'
      ? t
      : t.current_order
        ? { ...t, status: 'occupied' as const }
        : t.next_reservation
          ? { ...t, status: 'reserved' as const }
          : t,
  )
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

  const setStatus = useMutation({
    mutationFn: ({ table_id, status }: { table_id: number; status: Status }) =>
      setTableStatus(table_id, status),
    onSuccess: (t) => {
      toast.success(`${t.table_number} is now ${look[t.status].text.toLowerCase()}`)
      for (const key of ['tables', 'dashboard']) {
        queryClient.invalidateQueries({ queryKey: [key] })
      }
    },
    onError: (e) => toast.error(e.message),
  })

  const settingTable = (table_id: number) =>
    setStatus.isPending && setStatus.variables?.table_id === table_id
  const count = (f: Status | 'all') =>
    f === 'all' ? tables.length : tables.filter((t) => t.status === f).length
  const flash = useStatusFlash(tables.map((t) => ({ id: t.table_id, status: t.status })))
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
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors duration-200 pointer-coarse:min-h-11 ${filter === f ? 'bg-brand-charcoal border-brand-charcoal text-white' : 'border-brand-line text-brand-charcoal hover:border-brand-gold bg-white'}`}
          >
            {f === 'all' ? 'All' : look[f].text} ({count(f)})
          </button>
        ))}
      </div>

      {isLoadingError ? (
        <div className="mt-6">
          <LoadError what="the tables" onRetry={() => refetch()} />
        </div>
      ) : isPending ? (
        <ul
          aria-label="Loading tables"
          className="mt-6 grid grid-cols-1 gap-5 min-[380px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {Array.from({ length: 8 }, (_, i) => (
            <li
              key={i}
              className="border-brand-line flex min-h-52 flex-col rounded-lg border bg-white p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Skeleton className="h-7 w-28" />
                  <Skeleton className="mt-2 h-4 w-16" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="mt-auto h-10 w-full" />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-5 min-[380px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shown.map((t) => (
            <li
              key={t.table_id}
              aria-label={`Table ${t.table_number}`}
              className={`flex min-h-52 flex-col rounded-lg p-5 transition-colors duration-500 ${look[t.status].card} ${flash(t.table_id)}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-brand-charcoal font-serif text-2xl font-bold">
                    Table {t.table_number}
                  </h2>
                  <p className="text-brand-ink/70 text-sm">{t.capacity} seats</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${look[t.status].badge}`}
                >
                  {look[t.status].text}
                </span>
              </div>

              <div className="mt-5 flex flex-1 flex-col justify-end text-sm">
                {t.status === 'available' && (
                  <>
                    <p className="text-brand-ink/70 mb-auto">Ready for guests</p>
                    <button
                      type="button"
                      disabled={setStatus.isPending}
                      aria-busy={settingTable(t.table_id)}
                      onClick={() => setStatus.mutate({ table_id: t.table_id, status: 'occupied' })}
                      className={cardButton}
                    >
                      {settingTable(t.table_id) && <Spinner />}
                      Seat Guests
                    </button>
                  </>
                )}

                {t.status === 'occupied' &&
                  (t.current_order ? (
                    <>
                      <p className="text-brand-charcoal font-semibold">
                        Order #{t.current_order.order_id} · {peso(t.current_order.total_amount)}
                      </p>
                      <p className="text-brand-ink/70 mt-1">
                        Ordered{' '}
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
                      <p className="text-brand-ink/70 mb-auto">No unpaid or unserved order</p>
                      <button
                        type="button"
                        disabled={setStatus.isPending}
                        aria-busy={settingTable(t.table_id)}
                        onClick={() =>
                          setStatus.mutate({ table_id: t.table_id, status: 'available' })
                        }
                        className={cardButton}
                      >
                        {settingTable(t.table_id) && <Spinner />}
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
                      <p className="text-brand-ink/70 mt-1">{t.next_reservation.reference_code}</p>
                      <button
                        type="button"
                        disabled={arrive.isPending}
                        aria-busy={
                          arrive.isPending && arrive.variables === t.next_reservation.reservation_id
                        }
                        onClick={() => arrive.mutate(t.next_reservation!.reservation_id)}
                        className={cardButton}
                      >
                        {arrive.isPending &&
                          arrive.variables === t.next_reservation.reservation_id && <Spinner />}
                        Mark Arrived
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-brand-ink/70 mb-auto">No booking left today</p>
                      <button
                        type="button"
                        disabled={setStatus.isPending}
                        aria-busy={settingTable(t.table_id)}
                        onClick={() =>
                          setStatus.mutate({ table_id: t.table_id, status: 'available' })
                        }
                        className={cardButton}
                      >
                        {settingTable(t.table_id) && <Spinner />}
                        Free Table
                      </button>
                    </>
                  ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
