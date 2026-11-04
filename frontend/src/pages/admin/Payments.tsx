import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { format, parseISO, subDays } from 'date-fns'
import {
  Banknote,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Download,
  Search,
  Smartphone,
  Ticket,
  Wallet,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import EmptyState from '@/components/EmptyState'
import LoadError from '@/components/LoadError'
import Skeleton from '@/components/Skeleton'
import { allPages, downloadCsv } from '@/lib/csv'
import { listPayments, type AdminPayment } from '@/services/payments'
import type { PaymentMethod, PaymentStatus } from '@/types/db'

const perPage = 8
const peso = (amount: number) =>
  `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const th = 'px-5 py-3.5 text-left text-xs font-bold tracking-[0.14em] text-white/70 uppercase'
const td = 'text-brand-charcoal px-5 py-4 text-sm'
const dl = 'grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm'
const dt = 'text-brand-ink/70'
const dd = 'text-brand-charcoal text-right'
const select =
  'border-brand-line focus:border-brand-gold h-11 rounded-lg border bg-white px-3 text-sm outline-none'
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const statusBadge: Record<PaymentStatus, string> = {
  paid: 'bg-brand-green/10 text-brand-green',
  pending: 'bg-brand-gold/20 text-brand-gold-deep',
  failed: 'bg-brand-red/10 text-brand-red',
  refunded: 'bg-brand-ink/10 text-brand-ink',
}
const ranges = [
  { value: '', label: 'Date Range' },
  { value: '0', label: 'Today' },
  { value: '6', label: 'Last 7 days' },
  { value: '29', label: 'Last 30 days' },
]
const payId = (id: number) => `PAY-${String(id).padStart(4, '0')}`
const forText = (p: AdminPayment) =>
  p.for.type === 'order' ? `Order #${p.for.order_id}` : `Deposit ${p.for.reference_code}`

export default function Payments() {
  const [search, setSearch] = useState('')
  const [range, setRange] = useState('')
  const [method, setMethod] = useState<PaymentMethod | ''>('')
  const [status, setStatus] = useState<PaymentStatus | ''>('')
  const [page, setPage] = useState(1)
  const [today] = useState(() => new Date())
  const date_from = range ? format(subDays(today, Number(range)), 'yyyy-MM-dd') : undefined
  const { data, isPending, isLoadingError, refetch } = useQuery({
    queryKey: ['payments', { search, date_from, method, status, page }],
    placeholderData: keepPreviousData,
    queryFn: () =>
      listPayments({
        search,
        date_from,
        method: method || undefined,
        status: status || undefined,
        page,
      }),
  })
  const rows = data?.data ?? []
  const totals = data?.totals
  const total = data?.meta.total ?? 0

  const pages = Math.max(1, Math.ceil(total / perPage))
  const current = Math.min(page, pages)
  const first = total ? (current - 1) * perPage + 1 : 0
  const filtered = !!(search || range || method || status)
  const reset =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v)
      setPage(1)
    }
  const clear = () => {
    setSearch('')
    setRange('')
    setMethod('')
    setStatus('')
    setPage(1)
  }

  const [exporting, setExporting] = useState(false)
  const exportCsv = async () => {
    setExporting(true)
    try {
      const filter = { search, date_from, method: method || undefined, status: status || undefined }
      const all = await allPages((page, per_page) => listPayments({ ...filter, page, per_page }))
      downloadCsv(`payments-${format(today, 'yyyy-MM-dd')}.csv`, [
        ['Payment ID', 'Date', 'For', 'Method', 'Reference', 'Received By', 'Amount', 'Status'],
        ...all.map((p) => [
          payId(p.payment_id),
          p.paid_at ? format(parseISO(p.paid_at), 'yyyy-MM-dd HH:mm') : '',
          forText(p),
          cap(p.method),
          p.provider_reference ?? '',
          p.received_by?.full_name ?? '',
          p.amount.toFixed(2),
          cap(p.status),
        ]),
        [],
        ['Total Collected', '', '', '', '', '', (totals?.total_collected ?? 0).toFixed(2)],
        ['Online', '', '', '', '', '', (totals?.online ?? 0).toFixed(2)],
        ['Cash', '', '', '', '', '', (totals?.cash ?? 0).toFixed(2)],
        ['Deposits', '', '', '', '', '', (totals?.deposits ?? 0).toFixed(2)],
      ])
    } catch {
      toast.error("Couldn't export the payments. Try again.")
    } finally {
      setExporting(false)
    }
  }

  const stats = [
    { label: 'Total Collected', value: totals?.total_collected ?? 0, icon: Wallet, dark: true },
    { label: 'Online', value: totals?.online ?? 0, icon: Smartphone },
    { label: 'Cash', value: totals?.cash ?? 0, icon: Banknote },
    { label: 'Deposits', value: totals?.deposits ?? 0, icon: Ticket },
  ]

  return (
    <div>
      <dl className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`rounded-xl border px-6 py-5 ${s.dark ? 'bg-brand-charcoal border-brand-charcoal text-white' : 'border-brand-line text-brand-charcoal bg-white'}`}
          >
            <dt
              className={`flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase ${s.dark ? 'text-brand-gold' : 'text-brand-ink/70'}`}
            >
              <s.icon className="size-4" />
              {s.label}
            </dt>
            <dd className="mt-2 font-serif text-3xl lining-nums tabular-nums">{peso(s.value)}</dd>
          </div>
        ))}
      </dl>

      <div className="border-brand-line mt-5 flex flex-wrap items-center gap-3 rounded-xl border bg-white p-4">
        <label className="border-brand-line focus-within:border-brand-gold bg-brand-cream/40 flex h-11 w-full max-w-xs items-center gap-2 rounded-lg border px-3">
          <Search className="text-brand-ink/70 size-4" />
          <span className="sr-only">Search</span>
          <input
            type="search"
            value={search}
            onChange={(e) => reset(setSearch)(e.target.value)}
            placeholder="Payment ID, order #, ref code"
            className="w-full bg-transparent text-sm outline-none"
          />
        </label>
        <label>
          <span className="sr-only">Date range</span>
          <select
            value={range}
            onChange={(e) => reset(setRange)(e.target.value)}
            className={select}
          >
            {ranges.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Method</span>
          <select
            value={method}
            onChange={(e) => reset(setMethod)(e.target.value as PaymentMethod | '')}
            className={select}
          >
            <option value="">All Methods</option>
            <option value="online">Online</option>
            <option value="cash">Cash</option>
          </select>
        </label>
        <label>
          <span className="sr-only">Status</span>
          <select
            value={status}
            onChange={(e) => reset(setStatus)(e.target.value as PaymentStatus | '')}
            className={select}
          >
            <option value="">All Status</option>
            {(['paid', 'pending', 'failed', 'refunded'] as const).map((s) => (
              <option key={s} value={s}>
                {cap(s)}
              </option>
            ))}
          </select>
        </label>
        {filtered && (
          <button
            type="button"
            onClick={clear}
            className="text-brand-red text-sm font-bold hover:underline"
          >
            Clear filters
          </button>
        )}
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
        <div className="mt-5">
          <LoadError what="the payments" onRetry={() => refetch()} />
        </div>
      ) : (
        <div className="border-brand-line mt-5 overflow-x-auto rounded-xl border bg-white shadow-sm">
          <ul className="divide-brand-line divide-y md:hidden">
            {rows.map((p) => {
              const Icon = p.method === 'cash' ? Banknote : Smartphone
              return (
                <li key={p.payment_id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-brand-charcoal font-bold">{payId(p.payment_id)}</p>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${statusBadge[p.status]}`}
                    >
                      <span className="size-1.5 rounded-full bg-current" />
                      {cap(p.status)}
                    </span>
                  </div>
                  <dl className={dl}>
                    <dt className={dt}>Amount</dt>
                    <dd className={`${dd} font-semibold tabular-nums`}>{peso(p.amount)}</dd>
                    <dt className={dt}>Date</dt>
                    <dd className={dd}>
                      {p.paid_at ? (
                        <>
                          {format(parseISO(p.paid_at), 'MMMM d, yyyy')}{' '}
                          <span className="text-brand-ink/70 text-xs">
                            {format(parseISO(p.paid_at), 'h:mm a')}
                          </span>
                        </>
                      ) : (
                        <span className="text-brand-ink/70">Not paid</span>
                      )}
                    </dd>
                    <dt className={dt}>For</dt>
                    <dd className={dd}>
                      {p.for.type === 'order' ? (
                        <Link
                          to={`/admin/orders?order=${p.for.order_id}`}
                          className="inline-flex min-h-11 items-center font-bold underline"
                        >
                          {forText(p)}
                        </Link>
                      ) : (
                        <span className="text-brand-gold-deep font-bold">{forText(p)}</span>
                      )}
                    </dd>
                    <dt className={dt}>Method</dt>
                    <dd className={dd}>
                      <span className="inline-flex items-center gap-1.5">
                        <Icon className="text-brand-ink/70 size-4" />
                        {cap(p.method)}
                      </span>
                    </dd>
                    <dt className={dt}>Reference</dt>
                    <dd className={`${dd} text-brand-ink/70 font-mono text-xs break-all`}>
                      {p.provider_reference ?? '—'}
                    </dd>
                  </dl>
                </li>
              )
            })}
            {isPending &&
              Array.from({ length: 5 }, (_, i) => (
                <li key={i} className="space-y-3 p-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </li>
              ))}
          </ul>
          <table className="hidden w-full md:table">
            <thead className="bg-brand-charcoal">
              <tr>
                {['Payment ID', 'Date', 'For', 'Method', 'Reference', 'Amount', 'Status'].map(
                  (h) => (
                    <th key={h} className={`${th} ${h === 'Amount' ? 'text-right' : ''}`}>
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const Icon = p.method === 'cash' ? Banknote : Smartphone
                return (
                  <tr
                    key={p.payment_id}
                    className="border-brand-line/70 hover:bg-brand-cream/50 border-t transition-colors duration-150"
                  >
                    <td className={`${td} font-bold`}>{payId(p.payment_id)}</td>
                    <td className={`${td} whitespace-nowrap`}>
                      {p.paid_at ? (
                        <>
                          <span className="block">
                            {format(parseISO(p.paid_at), 'MMMM d, yyyy')}
                          </span>
                          <span className="text-brand-ink/70 text-xs">
                            {format(parseISO(p.paid_at), 'h:mm a')}
                          </span>
                        </>
                      ) : (
                        <span className="text-brand-ink/70">Not paid</span>
                      )}
                    </td>
                    <td className={td}>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-bold ${p.for.type === 'deposit' ? 'bg-brand-gold/15 text-brand-gold-deep' : 'bg-brand-cream text-brand-charcoal'}`}
                      >
                        {p.for.type === 'deposit' ? (
                          <Ticket className="size-3.5" />
                        ) : (
                          <CreditCard className="size-3.5" />
                        )}
                        {p.for.type === 'order' ? (
                          <Link
                            to={`/admin/orders?order=${p.for.order_id}`}
                            className="hover:underline"
                          >
                            {forText(p)}
                          </Link>
                        ) : (
                          forText(p)
                        )}
                      </span>
                    </td>
                    <td className={td}>
                      <span className="inline-flex items-center gap-1.5">
                        <Icon className="text-brand-ink/70 size-4" />
                        {cap(p.method)}
                      </span>
                    </td>
                    <td className={`${td} text-brand-ink/70 font-mono text-xs`}>
                      {p.provider_reference ?? '—'}
                    </td>
                    <td className={`${td} text-right font-semibold tabular-nums`}>
                      {peso(p.amount)}
                    </td>
                    <td className={td}>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${statusBadge[p.status]}`}
                      >
                        <span className="size-1.5 rounded-full bg-current" />
                        {cap(p.status)}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {isPending &&
                Array.from({ length: 5 }, (_, i) => (
                  <tr key={i} className="border-brand-line border-t">
                    {Array.from({ length: 7 }, (_, j) => (
                      <td key={j} className={td}>
                        <Skeleton className="h-4 w-full max-w-28" />
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
          {!isPending && rows.length === 0 && (
            <EmptyState icon={Wallet} title="No payments found." />
          )}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <p className="text-brand-ink/70 text-sm">
          Showing {first}–{Math.min(current * perPage, total)} of {total}
        </p>
        <nav aria-label="Pages" className="flex gap-2">
          <button
            type="button"
            aria-label="Previous page"
            disabled={current <= 1}
            onClick={() => setPage(current - 1)}
            className="border-brand-line flex size-9 items-center justify-center rounded-lg border bg-white disabled:opacity-40"
          >
            <ChevronLeft className="size-4" />
          </button>
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              aria-current={n === current ? 'page' : undefined}
              onClick={() => setPage(n)}
              className={`flex size-9 items-center justify-center rounded-lg border text-sm font-semibold ${n === current ? 'bg-brand-charcoal border-brand-charcoal text-white' : 'border-brand-line bg-white'}`}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            aria-label="Next page"
            disabled={current >= pages}
            onClick={() => setPage(current + 1)}
            className="border-brand-line flex size-9 items-center justify-center rounded-lg border bg-white disabled:opacity-40"
          >
            <ChevronRight className="size-4" />
          </button>
        </nav>
      </div>
    </div>
  )
}
