import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { formatTime } from '@/lib/hours'
import {
  listReservations,
  type ReservationView,
  updateReservationStatus,
} from '@/services/reservations'
import { getTables } from '@/services/tables'
import type { PublicReservation, ReservationStatus } from '@/types/db'

const th = 'text-brand-ink/70 px-4 py-3 text-left text-xs font-bold tracking-[0.1em] uppercase'
const td = 'text-brand-charcoal px-4 py-3 text-sm'
const control =
  'border-brand-line focus:border-brand-gold rounded-md border bg-white px-3 py-2.5 text-sm outline-none'
const action =
  'border-brand-charcoal text-brand-charcoal hover:bg-brand-charcoal rounded-md border px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors duration-200 hover:text-white'

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
  { value: 'today', label: 'Today' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default function TodaysReservations() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [view, setView] = useState<ReservationView>('today')
  const [status, setStatus] = useState<ReservationStatus | ''>('')
  const [page, setPage] = useState(1)
  const [assigning, setAssigning] = useState<PublicReservation | null>(null)
  const { data } = useQuery({
    queryKey: ['reservations', { view, status, search, page }],
    queryFn: () => listReservations({ view, status, search, page }),
  })
  const { data: tables = [] } = useQuery({ queryKey: ['tables'], queryFn: getTables })
  const change = useMutation({
    mutationFn: (args: { id: number; status?: ReservationStatus; table_id?: number }) =>
      updateReservationStatus(args.id, { status: args.status, table_id: args.table_id }),
    onSuccess: (r) => {
      toast.success(`${r.reference_code} is now ${statusText[r.status].toLowerCase()}`)
      setAssigning(null)
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
      queryClient.invalidateQueries({ queryKey: ['tables'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (e) => toast.error(e.message),
  })

  const rows = data?.data ?? []
  const total = data?.meta.total ?? 0
  const pages = Math.max(1, Math.ceil(total / 8))
  const first = total === 0 ? 0 : (page - 1) * 8 + 1
  const resetPage =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v)
      setPage(1)
    }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <label className="border-brand-line focus-within:border-brand-gold flex w-80 items-center gap-2 rounded-md border bg-white px-3">
          <Search className="text-brand-ink/60 size-4 shrink-0" />
          <span className="sr-only">Search</span>
          <input
            type="search"
            value={search}
            onChange={(e) => resetPage(setSearch)(e.target.value)}
            placeholder="Search ref code or name"
            className="placeholder:text-brand-ink/50 w-full py-2.5 text-sm outline-none"
          />
        </label>
        <label>
          <span className="sr-only">Day</span>
          <select
            value={view}
            onChange={(e) => resetPage(setView)(e.target.value as ReservationView)}
            className={control}
          >
            {views.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Status</span>
          <select
            value={status}
            onChange={(e) => resetPage(setStatus)(e.target.value as ReservationStatus | '')}
            className={control}
          >
            <option value="">All Status</option>
            {Object.entries(statusText).map(([value, text]) => (
              <option key={value} value={value}>
                {text}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="border-brand-line mt-6 overflow-x-auto rounded-lg border bg-white">
        <table className="w-full min-w-[60rem]">
          <thead className="bg-brand-cream/60">
            <tr>
              {[
                'Ref Code',
                'Time',
                'Name',
                'Mobile',
                'Guests',
                'Table',
                'Deposit',
                'Status',
                'Actions',
              ].map((h) => (
                <th key={h} className={th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.reservation_id} className="border-brand-line border-t">
                <td className={`${td} font-semibold`}>{r.reference_code}</td>
                <td className={`${td} whitespace-nowrap tabular-nums`}>
                  {view === 'today' && !search ? '' : `${r.reservation_date} `}
                  {formatTime(r.reservation_time)}
                </td>
                <td className={td}>{r.customer.full_name}</td>
                <td className={`${td} whitespace-nowrap tabular-nums`}>
                  {r.customer.mobile_number.replace(/^(\d{4})(\d{3})(\d{4})$/, '$1 $2 $3')}
                </td>
                <td className={td}>{r.pax}</td>
                <td className={td}>{r.table_number ?? '—'}</td>
                <td className={td}>{r.deposit_status === 'paid' ? 'Paid' : 'Unpaid'}</td>
                <td className={td}>
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap ${statusBadge[r.status]}`}
                  >
                    {statusText[r.status]}
                  </span>
                </td>
                <td className={td}>
                  {r.status === 'confirmed' && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        aria-label={`Mark ${r.reference_code} arrived`}
                        onClick={() => change.mutate({ id: r.reservation_id, status: 'arrived' })}
                        className={action}
                      >
                        Arrived
                      </button>
                      <button
                        type="button"
                        aria-label={`Mark ${r.reference_code} no-show`}
                        onClick={() => change.mutate({ id: r.reservation_id, status: 'no_show' })}
                        className={action}
                      >
                        No-show
                      </button>
                    </div>
                  )}
                  {r.status === 'pending' && (
                    <button
                      type="button"
                      aria-label={`Assign a table to ${r.reference_code}`}
                      onClick={() => setAssigning(r)}
                      className={action}
                    >
                      Assign Table
                    </button>
                  )}
                  {r.status !== 'confirmed' && r.status !== 'pending' && (
                    <span className="text-brand-ink/50">—</span>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="text-brand-ink/60 px-4 py-10 text-center text-sm">
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

      {assigning && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="assign-title"
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id="assign-title" className="text-brand-charcoal font-serif text-2xl font-bold">
                Assign a table
              </h2>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setAssigning(null)}
                className="text-brand-ink/60 hover:text-brand-charcoal"
              >
                <X className="size-5" />
              </button>
            </div>
            <p className="text-brand-ink/75 mt-2 text-sm">
              {assigning.reference_code} · {assigning.customer.full_name} · {assigning.pax}{' '}
              {assigning.pax === 1 ? 'guest' : 'guests'} at {formatTime(assigning.reservation_time)}
            </p>
            <ul className="mt-5 grid grid-cols-4 gap-2">
              {tables
                .filter((t) => t.capacity >= assigning.pax)
                .map((t) => (
                  <li key={t.table_id}>
                    <button
                      type="button"
                      onClick={() =>
                        change.mutate({ id: assigning.reservation_id, table_id: t.table_id })
                      }
                      className="border-brand-line hover:border-brand-red w-full rounded-md border px-2 py-3 text-center transition-colors duration-200"
                    >
                      <span className="text-brand-charcoal block text-sm font-bold">
                        {t.table_number}
                      </span>
                      <span className="text-brand-ink/60 block text-xs">{t.capacity} seats</span>
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
