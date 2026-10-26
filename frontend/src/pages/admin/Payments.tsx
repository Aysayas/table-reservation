import { useQuery } from '@tanstack/react-query'
import { format, parseISO, subDays } from 'date-fns'
import {
  Banknote,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Search,
  Smartphone,
  Ticket,
  Wallet,
} from 'lucide-react'
import { useState } from 'react'
import { listPayments, type AdminPayment } from '@/services/payments'
import type { PaymentMethod, PaymentStatus } from '@/types/db'

const perPage = 8
const peso = (amount: number) =>
  `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const th = 'px-5 py-3.5 text-left text-[11px] font-bold tracking-[0.14em] text-white/70 uppercase'
const td = 'text-brand-charcoal px-5 py-4 text-sm'
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
  const { data } = useQuery({
    queryKey: ['payments', { search, date_from, method, status }],
    queryFn: () =>
      listPayments({
        search,
        date_from,
        method: method || undefined,
        status: status || undefined,
      }),
  })
  const payments = data?.data ?? []
  const totals = data?.totals

  const pages = Math.max(1, Math.ceil(payments.length / perPage))
  const current = Math.min(page, pages)
  const rows = payments.slice((current - 1) * perPage, current * perPage)
  const first = payments.length ? (current - 1) * perPage + 1 : 0
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
              className={`flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase ${s.dark ? 'text-brand-gold' : 'text-brand-ink/60'}`}
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
          <Search className="text-brand-ink/50 size-4" />
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
      </div>

      <div className="border-brand-line mt-5 overflow-hidden rounded-xl border bg-white shadow-sm">
        <table className="w-full">
          <thead className="bg-brand-charcoal">
            <tr>
              {['Payment ID', 'Date', 'For', 'Method', 'Reference', 'Amount', 'Status'].map((h) => (
                <th key={h} className={`${th} ${h === 'Amount' ? 'text-right' : ''}`}>
                  {h}
                </th>
              ))}
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
                        <span className="block">{format(parseISO(p.paid_at), 'MMMM d, yyyy')}</span>
                        <span className="text-brand-ink/50 text-xs">
                          {format(parseISO(p.paid_at), 'h:mm a')}
                        </span>
                      </>
                    ) : (
                      <span className="text-brand-ink/40">Not paid</span>
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
                      {forText(p)}
                    </span>
                  </td>
                  <td className={td}>
                    <span className="inline-flex items-center gap-1.5">
                      <Icon className="text-brand-ink/50 size-4" />
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
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-14 text-center">
                  <Wallet className="text-brand-gold-deep/60 mx-auto size-8" />
                  <p className="text-brand-ink/60 mt-3 text-sm">No payments found.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-brand-ink/70 text-sm">
          Showing {first}–{Math.min(current * perPage, payments.length)} of {payments.length}
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
