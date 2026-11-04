import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { CalendarX2, ChevronLeft, ChevronRight, Download, Search } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import EmptyState from '@/components/EmptyState'
import LoadError from '@/components/LoadError'
import Skeleton from '@/components/Skeleton'
import { allPages, downloadCsv } from '@/lib/csv'
import { formatTime } from '@/lib/hours'
import { listReservations, type ReservationView } from '@/services/reservations'
import EditReservationDialog from '@/components/EditReservationDialog'
import ReservationActions from '@/components/ReservationActions'
import type { PublicReservation, ReservationStatus } from '@/types/db'

const th = 'text-brand-ink/70 px-3 py-3 text-left text-xs font-bold tracking-[0.1em] uppercase'
const td = 'text-brand-charcoal px-3 py-3 text-sm whitespace-nowrap'
const dl = 'grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm'
const dt = 'text-brand-ink/70'
const dd = 'text-brand-charcoal text-right'

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
export default function Reservations() {
  const [view, setView] = useState<ReservationView>('upcoming')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<PublicReservation | null>(null)
  const { data, isPending, isLoadingError, refetch } = useQuery({
    queryKey: ['reservations', { view, status: '', search, page }],
    placeholderData: keepPreviousData,
    queryFn: () => listReservations({ view, status: '', search, page }),
    refetchInterval: 30000,
  })

  const rows = data?.data ?? []
  const total = data?.meta.total ?? 0
  const pages = Math.max(1, Math.ceil(total / 8))
  const first = total ? (page - 1) * 8 + 1 : 0

  const [exporting, setExporting] = useState(false)
  const exportCsv = async () => {
    setExporting(true)
    try {
      const all = await allPages((p, per_page) =>
        listReservations({ view, status: '', search, page: p, per_page }),
      )
      downloadCsv(`reservations-${view}-${format(new Date(), 'yyyy-MM-dd')}.csv`, [
        [
          'Ref Code',
          'Date',
          'Time',
          'Guests',
          'Name',
          'Mobile',
          'Table',
          'Status',
          'Deposit',
          'Deposit Status',
          'Special Request',
        ],
        ...all.map((r) => [
          r.reference_code,
          r.reservation_date,
          formatTime(r.reservation_time),
          r.pax,
          r.customer.full_name,
          r.customer.mobile_number,
          r.table_number ?? '',
          statusText[r.status],
          r.deposit_amount.toFixed(2),
          r.deposit_status === 'paid' ? 'Paid' : 'Unpaid',
          r.special_request ?? '',
        ]),
      ])
    } catch {
      toast.error("Couldn't export the reservations. Try again.")
    } finally {
      setExporting(false)
    }
  }

  return (
    <div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <label className="border-brand-line focus-within:border-brand-gold flex w-full max-w-80 items-center gap-2 rounded-md border bg-white px-3">
            <Search className="text-brand-ink/70 size-4 shrink-0" />
            <span className="sr-only">Search</span>
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Search ref code or name"
              className="placeholder:text-brand-ink/65 w-full py-2.5 text-sm outline-none"
            />
          </label>
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
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors duration-200 pointer-coarse:min-h-11 ${view === v.value ? 'bg-brand-charcoal border-brand-charcoal text-white' : 'border-brand-line text-brand-charcoal hover:border-brand-gold bg-white'}`}
              >
                {v.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={exportCsv}
            disabled={!total || exporting}
            aria-busy={exporting}
            className="bg-brand-charcoal hover:bg-brand-charcoal/90 ml-auto flex h-11 items-center gap-2 rounded-lg px-5 text-sm font-bold text-white transition-colors duration-200 disabled:opacity-50"
          >
            <Download className="size-4" />
            Export
          </button>
        </div>

        {isLoadingError ? (
          <div className="mt-6">
            <LoadError what="the reservations" onRetry={() => refetch()} />
          </div>
        ) : (
          <div className="border-brand-line relative mt-6 overflow-x-auto rounded-lg border bg-white">
            <ul className="divide-brand-line divide-y md:hidden">
              {rows.map((r) => (
                <li key={r.reservation_id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-brand-charcoal font-semibold">{r.reference_code}</p>
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${statusBadge[r.status]}`}
                    >
                      {statusText[r.status]}
                    </span>
                  </div>
                  <dl className={dl}>
                    <dt className={dt}>Date</dt>
                    <dd className={dd}>
                      {format(parseISO(r.reservation_date), 'EEE, MMM d, yyyy')}
                    </dd>
                    <dt className={dt}>Time</dt>
                    <dd className={`${dd} tabular-nums`}>{formatTime(r.reservation_time)}</dd>
                    <dt className={dt}>Name</dt>
                    <dd className={dd}>{r.customer.full_name}</dd>
                    <dt className={dt}>Guests</dt>
                    <dd className={dd}>{r.pax}</dd>
                    <dt className={dt}>Table</dt>
                    <dd className={dd}>{r.table_number ?? '—'}</dd>
                    <dt className={dt}>Added</dt>
                    <dd className={dd}>
                      {format(parseISO(r.created_at), 'MMM d, yyyy')}{' '}
                      <span className="text-brand-ink/70 text-xs">
                        {format(parseISO(r.created_at), 'h:mm a')}
                      </span>
                    </dd>
                  </dl>
                  <ReservationActions
                    reservation={r}
                    onEdit={
                      r.status === 'pending' || r.status === 'confirmed'
                        ? () => setEditing(r)
                        : undefined
                    }
                  />
                </li>
              ))}
              {isPending &&
                Array.from({ length: 5 }, (_, i) => (
                  <li key={i} className="space-y-3 p-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </li>
                ))}
            </ul>
            <table className="hidden w-full md:table">
              <thead className="bg-brand-cream/60">
                <tr>
                  {['Ref Code', 'Date', 'Time', 'Name', 'Guests', 'Table', 'Added', 'Status'].map(
                    (h) => (
                      <th key={h} className={th}>
                        {h}
                      </th>
                    ),
                  )}
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
                    <td className={td}>{r.table_number ?? '—'}</td>
                    <td className={td}>
                      <span className="block">{format(parseISO(r.created_at), 'MMM d, yyyy')}</span>
                      <span className="text-brand-ink/70 block text-xs">
                        {format(parseISO(r.created_at), 'h:mm a')}
                      </span>
                    </td>
                    <td className={td}>
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${statusBadge[r.status]}`}
                      >
                        {statusText[r.status]}
                      </span>
                    </td>
                    <td className={td}>
                      <ReservationActions
                        reservation={r}
                        onEdit={
                          r.status === 'pending' || r.status === 'confirmed'
                            ? () => setEditing(r)
                            : undefined
                        }
                      />
                    </td>
                  </tr>
                ))}
                {isPending &&
                  Array.from({ length: 5 }, (_, i) => (
                    <tr key={i} className="border-brand-line border-t">
                      {Array.from({ length: 9 }, (_, j) => (
                        <td key={j} className={td}>
                          <Skeleton className="h-4 w-full max-w-28" />
                        </td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            </table>
            {!isPending && rows.length === 0 && (
              <EmptyState icon={CalendarX2} title="No reservations found." />
            )}
          </div>
        )}

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

      {editing && <EditReservationDialog reservation={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}
