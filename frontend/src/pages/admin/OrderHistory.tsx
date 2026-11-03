import { useQuery } from '@tanstack/react-query'
import { format, parseISO, subDays } from 'date-fns'
import {
  Banknote,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  ReceiptText,
  Search,
  Smartphone,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import EmptyState from '@/components/EmptyState'
import LoadError from '@/components/LoadError'
import Modal from '@/components/Modal'
import Skeleton from '@/components/Skeleton'
import { listOrders, type StaffOrder } from '@/services/orders'
import type { OrderStatus } from '@/types/db'

const perPage = 8
const peso = (amount: number) =>
  `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const th = 'text-brand-ink/70 px-5 py-3.5 text-left text-xs font-bold tracking-[0.14em] uppercase'
const td = 'text-brand-charcoal px-5 py-4 text-sm'
const select =
  'border-brand-line focus:border-brand-gold h-11 rounded-lg border bg-white px-3 text-sm outline-none'
const orderBadge: Record<OrderStatus, string> = {
  received: 'border-brand-line border bg-white text-brand-charcoal',
  preparing: 'bg-brand-charcoal text-white',
  ready: 'bg-brand-red text-white',
  served: 'bg-brand-ink/10 text-brand-ink',
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const ranges = [
  { value: '', label: 'Date Range' },
  { value: '0', label: 'Today' },
  { value: '6', label: 'Last 7 days' },
  { value: '29', label: 'Last 30 days' },
]
const itemCount = (o: StaffOrder) => o.items.reduce((n, i) => n + i.quantity, 0)

function PaymentBadge({ order }: { order: StaffOrder }) {
  const paid = order.payment_status === 'paid'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${paid ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-gold/20 text-brand-gold-deep'}`}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {paid ? 'Paid' : 'Unpaid'}
    </span>
  )
}

function Method({ method }: { method: StaffOrder['payment_method'] }) {
  if (!method) return <span className="text-brand-ink/70">—</span>
  const Icon = method === 'cash' ? Banknote : Smartphone
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="text-brand-ink/70 size-4" />
      {cap(method)}
    </span>
  )
}

export default function OrderHistory() {
  const [params] = useSearchParams()
  const [search, setSearch] = useState(() => params.get('order') ?? '')
  const [range, setRange] = useState('')
  const [status, setStatus] = useState<OrderStatus | ''>('')
  const [payment, setPayment] = useState<'paid' | 'unpaid' | ''>('')
  const [page, setPage] = useState(1)
  const [viewing, setViewing] = useState<StaffOrder | null>(null)
  const [today] = useState(() => new Date())
  const date_from = range ? format(subDays(today, Number(range)), 'yyyy-MM-dd') : undefined
  const {
    data: orders = [],
    isPending,
    isLoadingError,
    refetch,
  } = useQuery({
    queryKey: ['orders', 'history', { search, date_from, status, payment }],
    queryFn: () =>
      listOrders({
        search,
        date_from,
        status: status ? [status] : undefined,
        payment_status: payment || undefined,
      }),
  })

  const pages = Math.max(1, Math.ceil(orders.length / perPage))
  const current = Math.min(page, pages)
  const rows = orders.slice((current - 1) * perPage, current * perPage)
  const first = orders.length ? (current - 1) * perPage + 1 : 0
  const filtered = !!(search || range || status || payment)
  const reset =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v)
      setPage(1)
    }
  const clear = () => {
    setSearch('')
    setRange('')
    setStatus('')
    setPayment('')
    setPage(1)
  }

  const exportCsv = () => {
    const header = ['Order #', 'Date', 'Table', 'Items', 'Total', 'Payment', 'Method', 'Status']
    const lines = orders.map((o) =>
      [
        o.order_id,
        format(parseISO(o.created_at), 'yyyy-MM-dd HH:mm'),
        o.table_number,
        itemCount(o),
        o.total_amount.toFixed(2),
        o.payment_status === 'paid' ? 'Paid' : 'Unpaid',
        o.payment_method ? cap(o.payment_method) : '',
        cap(o.status),
      ].join(','),
    )
    const link = document.createElement('a')
    link.href = URL.createObjectURL(
      new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv' }),
    )
    link.download = `order-history-${format(today, 'yyyy-MM-dd')}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  return (
    <div>
      <div className="border-brand-line flex flex-wrap items-center gap-3 rounded-xl border bg-white p-4">
        <label className="border-brand-line focus-within:border-brand-gold bg-brand-cream/40 flex h-11 w-full max-w-xs items-center gap-2 rounded-lg border px-3">
          <Search className="text-brand-ink/70 size-4" />
          <span className="sr-only">Search</span>
          <input
            type="search"
            value={search}
            onChange={(e) => reset(setSearch)(e.target.value)}
            placeholder="Search order # or table"
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
          <span className="sr-only">Status</span>
          <select
            value={status}
            onChange={(e) => reset(setStatus)(e.target.value as OrderStatus | '')}
            className={select}
          >
            <option value="">All Status</option>
            {(['received', 'preparing', 'ready', 'served'] as const).map((s) => (
              <option key={s} value={s}>
                {cap(s)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Payment</span>
          <select
            value={payment}
            onChange={(e) => reset(setPayment)(e.target.value as 'paid' | 'unpaid' | '')}
            className={select}
          >
            <option value="">All Payments</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
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
          disabled={!orders.length}
          className="bg-brand-charcoal hover:bg-brand-charcoal/90 ml-auto flex h-11 items-center gap-2 rounded-lg px-5 text-sm font-bold text-white transition-colors duration-200 disabled:opacity-50"
        >
          <Download className="size-4" />
          Export
        </button>
      </div>

      {isLoadingError ? (
        <div className="mt-5">
          <LoadError what="the orders" onRetry={() => refetch()} />
        </div>
      ) : (
        <div className="border-brand-line relative mt-5 overflow-x-auto rounded-xl border bg-white shadow-sm">
          <table className="w-full">
            <thead className="bg-brand-charcoal">
              <tr>
                {['Order #', 'Date', 'Table', 'Items', 'Total', 'Payment', 'Method', 'Status'].map(
                  (h) => (
                    <th
                      key={h}
                      className={`${th} text-white/70 ${h === 'Total' ? 'text-right' : ''}`}
                    >
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
              {rows.map((o) => (
                <tr
                  key={o.order_id}
                  className="border-brand-line/70 hover:bg-brand-cream/50 border-t transition-colors duration-150"
                >
                  <td className={`${td} text-base font-bold`}>#{o.order_id}</td>
                  <td className={`${td} whitespace-nowrap`}>
                    <span className="block">{format(parseISO(o.created_at), 'MMMM d, yyyy')}</span>
                    <span className="text-brand-ink/70 text-xs">
                      {format(parseISO(o.created_at), 'h:mm a')}
                    </span>
                  </td>
                  <td className={td}>
                    <span className="border-brand-line bg-brand-cream/60 rounded-md border px-2 py-1 text-xs font-bold">
                      {o.table_number}
                    </span>
                  </td>
                  <td className={`${td} tabular-nums`}>{itemCount(o)}</td>
                  <td className={`${td} text-right font-semibold tabular-nums`}>
                    {peso(o.total_amount)}
                  </td>
                  <td className={td}>
                    <PaymentBadge order={o} />
                  </td>
                  <td className={td}>
                    <Method method={o.payment_method} />
                  </td>
                  <td className={td}>
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${orderBadge[o.status]}`}
                    >
                      {cap(o.status)}
                    </span>
                  </td>
                  <td className={`${td} text-right`}>
                    <button
                      type="button"
                      aria-label={`View order #${o.order_id}`}
                      onClick={() => setViewing(o)}
                      className="border-brand-line text-brand-charcoal hover:border-brand-red hover:text-brand-red inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors duration-200"
                    >
                      <Eye className="size-3.5" />
                      View
                    </button>
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
              {!isPending && rows.length === 0 && (
                <tr>
                  <td colSpan={9}>
                    <EmptyState icon={ReceiptText} title="No orders found." />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <p className="text-brand-ink/70 text-sm">
          Showing {first}–{Math.min(current * perPage, orders.length)} of {orders.length}
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

      {viewing && (
        <Modal title={`Order #${viewing.order_id}`} onClose={() => setViewing(null)}>
          <button
            type="button"
            aria-label="Close"
            onClick={() => setViewing(null)}
            className="text-brand-ink/70 hover:text-brand-charcoal absolute top-4 right-4 transition-colors duration-200"
          >
            <X className="size-5" />
          </button>
          <div className="text-center">
            <p className="text-brand-gold text-xs font-bold tracking-[0.2em] uppercase">
              Order details
            </p>
            <p className="text-brand-ink/70 mt-1 text-sm">
              Table {viewing.table_number} ·{' '}
              {format(parseISO(viewing.created_at), 'MMMM d, yyyy h:mm a')}
            </p>
          </div>
          <div className="mt-5">
            <div className="flex gap-2">
              <PaymentBadge order={viewing} />
              <span
                className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${orderBadge[viewing.status]}`}
              >
                {cap(viewing.status)}
              </span>
            </div>
            <ul className="mt-4 space-y-3 text-sm">
              {viewing.items.map((item) => (
                <li key={item.order_item_id} className="flex justify-between gap-4">
                  <span className="text-brand-charcoal">
                    <span className="font-bold">{item.quantity}×</span> {item.name}
                    {item.notes && (
                      <span className="text-brand-red block text-xs">Note: {item.notes}</span>
                    )}
                  </span>
                  <span className="shrink-0 tabular-nums">
                    {peso(item.unit_price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <dl className="border-brand-line mt-5 space-y-2 border-t border-dashed pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-brand-ink/70">Subtotal</dt>
                <dd className="tabular-nums">{peso(viewing.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-brand-ink/70">Service Charge</dt>
                <dd className="tabular-nums">{peso(viewing.service_charge)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-brand-ink/70">Payment</dt>
                <dd>
                  <Method method={viewing.payment_method} />
                </dd>
              </div>
              <div className="border-brand-line flex justify-between border-t pt-3 font-serif text-xl font-bold">
                <dt>Total</dt>
                <dd className="text-brand-red tabular-nums">{peso(viewing.total_amount)}</dd>
              </div>
            </dl>
          </div>
        </Modal>
      )}
    </div>
  )
}
