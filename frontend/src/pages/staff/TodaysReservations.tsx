import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { CalendarX, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useState } from 'react'
import EmptyState from '@/components/EmptyState'
import LoadError from '@/components/LoadError'
import ReservationActions from '@/components/ReservationActions'
import Skeleton from '@/components/Skeleton'
import { formatTime } from '@/lib/hours'
import { listReservations, type ReservationView } from '@/services/reservations'
import type { ReservationStatus } from '@/types/db'

const th = 'text-brand-ink/70 px-4 py-3 text-left text-xs font-bold tracking-label uppercase'
const td = 'text-brand-charcoal px-4 py-3 text-sm'
const card =
  'max-md:flex max-md:flex-wrap max-md:items-center max-md:gap-x-3 max-md:gap-y-2 max-md:p-4'
const line =
  'max-md:order-1 max-md:flex max-md:basis-full max-md:justify-between max-md:gap-3 max-md:p-0'
const label = 'text-brand-ink/70 text-xs font-bold tracking-label uppercase md:hidden'
const control =
  'border-brand-line focus:border-brand-gold rounded-lg border bg-white px-3 py-2.5 text-sm outline-none'

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
  const [search, setSearch] = useState('')
  const [view, setView] = useState<ReservationView>('today')
  const [status, setStatus] = useState<ReservationStatus | ''>('')
  const [page, setPage] = useState(1)
  const { data, isPending, isLoadingError, refetch } = useQuery({
    queryKey: ['reservations', { view, status, search, page }],
    placeholderData: keepPreviousData,
    queryFn: () => listReservations({ view, status, search, page }),
    refetchInterval: 30000,
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
        <label className="border-brand-line focus-within:border-brand-gold flex w-full items-center gap-2 rounded-lg border bg-white px-3 sm:w-80">
          <Search className="text-brand-ink/70 size-4 shrink-0" />
          <span className="sr-only">Search</span>
          <input
            type="search"
            value={search}
            onChange={(e) => resetPage(setSearch)(e.target.value)}
            placeholder="Search ref code or name"
            className="placeholder:text-brand-ink/65 w-full py-2.5 text-sm outline-none"
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

      {isLoadingError ? (
        <div className="mt-6">
          <LoadError what="today's reservations" onRetry={() => refetch()} />
        </div>
      ) : (
        <div className="border-brand-line mt-6 overflow-x-auto rounded-lg border bg-white">
          <table className="w-full max-md:block md:min-w-[60rem]">
            <thead className="bg-brand-cream/60 max-md:hidden">
              <tr>
                {[
                  'Ref Code',
                  'Time',
                  'Name',
                  'Mobile',
                  'Guests',
                  'Table',
                  'Added',
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
            <tbody className="max-md:block">
              {rows.map((r) => (
                <tr key={r.reservation_id} className={`border-brand-line border-t ${card}`}>
                  <td className={`${td} font-semibold whitespace-nowrap max-md:flex-1 max-md:p-0`}>
                    {r.reference_code}
                  </td>
                  <td className={`${td} ${line} whitespace-nowrap tabular-nums`}>
                    <span className={label}>Time</span>
                    <span>
                      {view === 'today' && !search ? '' : `${r.reservation_date} `}
                      {formatTime(r.reservation_time)}
                    </span>
                  </td>
                  <td className={`${td} ${line}`}>
                    <span className={label}>Name</span>
                    <span>{r.customer.full_name}</span>
                  </td>
                  <td className={`${td} ${line} whitespace-nowrap tabular-nums`}>
                    <span className={label}>Mobile</span>
                    <span>
                      {r.customer.mobile_number.replace(/^(\d{4})(\d{3})(\d{4})$/, '$1 $2 $3')}
                    </span>
                  </td>
                  <td className={`${td} ${line}`}>
                    <span className={label}>Guests</span>
                    <span>{r.pax}</span>
                  </td>
                  <td className={`${td} ${line}`}>
                    <span className={label}>Table</span>
                    <span>{r.table_number ?? '—'}</span>
                  </td>
                  <td className={`${td} ${line}`}>
                    <span className={label}>Added</span>
                    <span className="max-md:flex max-md:gap-1">
                      <span className="block whitespace-nowrap">
                        {format(parseISO(r.created_at), 'MMM d')}
                      </span>
                      <span className="text-brand-ink/70 block text-xs max-md:text-sm">
                        {format(parseISO(r.created_at), 'h:mm a')}
                      </span>
                    </span>
                  </td>
                  <td className={`${td} ${line}`}>
                    <span className={label}>Deposit</span>
                    <span>{r.deposit_status === 'paid' ? 'Paid' : 'Unpaid'}</span>
                  </td>
                  <td className={`${td} max-md:p-0`}>
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap ${statusBadge[r.status]}`}
                    >
                      {statusText[r.status]}
                    </span>
                  </td>
                  <td
                    className={`${td} max-md:order-2 max-md:basis-full max-md:p-0 max-md:pt-2 max-md:[&>div>button:not([popovertarget])]:flex-1`}
                  >
                    <ReservationActions reservation={r} />
                  </td>
                </tr>
              ))}
              {isPending &&
                Array.from({ length: 5 }, (_, i) => (
                  <tr key={i} className={`border-brand-line border-t ${card}`}>
                    {Array.from({ length: 10 }, (_, j) => (
                      <td key={j} className={`${td} max-md:basis-full max-md:p-0`}>
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))}
              {!isPending && rows.length === 0 && (
                <tr className="max-md:block">
                  <td colSpan={10} className="max-md:block">
                    <EmptyState icon={CalendarX} title="No reservations found." />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
            className="border-brand-line flex size-9 items-center justify-center rounded-lg border bg-white disabled:opacity-40 pointer-coarse:size-11"
          >
            <ChevronLeft className="size-4" />
          </button>
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              aria-current={n === page ? 'page' : undefined}
              onClick={() => setPage(n)}
              className={`flex size-9 items-center justify-center rounded-lg border text-sm font-semibold pointer-coarse:size-11 ${n === page ? 'bg-brand-charcoal border-brand-charcoal text-white' : 'border-brand-line bg-white'}`}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            aria-label="Next page"
            disabled={page >= pages}
            onClick={() => setPage(page + 1)}
            className="border-brand-line flex size-9 items-center justify-center rounded-lg border bg-white disabled:opacity-40 pointer-coarse:size-11"
          >
            <ChevronRight className="size-4" />
          </button>
        </nav>
      </div>
    </div>
  )
}
