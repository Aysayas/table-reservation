import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { Printer, ReceiptText } from 'lucide-react'
import { useState } from 'react'
import { flushSync } from 'react-dom'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import EmptyState from '@/components/EmptyState'
import LoadError from '@/components/LoadError'
import Receipt from '@/components/Receipt'
import Skeleton from '@/components/Skeleton'
import Spinner from '@/components/Spinner'
import useOrderEvents, { STAFF_CHANNEL } from '@/hooks/useOrderEvents'
import { listOrders, recordPayment } from '@/services/orders'
import { getMe } from '@/services/auth'
import { getSettings } from '@/services/settings'
import type { OrderStatus } from '@/types/db'
import useStatusFlash from '@/hooks/useStatusFlash'
import useSlidingPill from '@/hooks/useSlidingPill'

const peso = (amount: number) =>
  `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const th = 'text-brand-ink/70 px-4 py-3 text-left text-xs font-bold tracking-label uppercase'
const td = 'text-brand-charcoal px-4 py-3 text-sm'
const card =
  'max-md:flex max-md:flex-wrap max-md:items-center max-md:gap-x-3 max-md:gap-y-2 max-md:p-4'
const line =
  'max-md:order-1 max-md:flex max-md:basis-full max-md:justify-between max-md:gap-3 max-md:p-0'
const label = 'text-brand-ink/70 text-xs font-bold tracking-label uppercase md:hidden'
const orderBadge: Record<OrderStatus, string> = {
  received: 'border-brand-line border bg-white text-brand-charcoal',
  preparing: 'bg-brand-charcoal text-white',
  ready: 'bg-brand-red text-white',
  served: 'bg-brand-ink/10 text-brand-ink',
}
const filters = [
  { value: '', label: 'Today' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'paid', label: 'Paid Today' },
] as const
const time = (iso: string) => format(parseISO(iso), 'h:mm a')
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export default function OrdersPayments() {
  const queryClient = useQueryClient()
  const [params, setParams] = useSearchParams()
  const [filter, setFilter] = useState<'' | 'paid' | 'unpaid'>('')
  const [pillsRef, pills, pillsOn] = useSlidingPill(filter)
  const [cash, setCash] = useState('')
  const {
    data: orders = [],
    isPending,
    isLoadingError,
    refetch,
  } = useQuery({
    queryKey: ['orders', filter],
    placeholderData: keepPreviousData,
    queryFn: () =>
      listOrders({
        payment_status: filter || undefined,
        date_from: filter === 'unpaid' ? undefined : format(new Date(), 'yyyy-MM-dd'),
      }),
    refetchInterval: 15000,
  })
  const flash = useStatusFlash(
    orders.map((o) => ({ id: o.order_id, status: `${o.status}/${o.payment_status}` })),
  )
  useOrderEvents(STAFF_CHANNEL, ['orders'])
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: getSettings })
  const { data: me } = useQuery({ queryKey: ['me', 'staff'], queryFn: () => getMe('staff') })
  const [paidCash, setPaidCash] = useState<Record<number, number>>({})
  const [printedAt, setPrintedAt] = useState(() => new Date())
  const selectedId = Number(params.get('order')) || null
  const selected = orders.find((o) => o.order_id === selectedId)
  const received = Number(cash) || 0
  const pay = useMutation({
    mutationFn: () =>
      recordPayment({ order_id: selected!.order_id, amount: selected!.total_amount }),
    onSuccess: (payment) => {
      setPaidCash((cashes) => ({ ...cashes, [payment.order_id]: received }))
      toast.success(
        `Order #${payment.order_id} paid in cash. Change: ${peso(Math.max(0, received - payment.amount))}`,
      )
      setCash('')
      for (const key of ['orders', 'tables', 'dashboard']) {
        queryClient.invalidateQueries({ queryKey: [key] })
      }
    },
    onError: (e) => toast.error(e.message),
  })

  const select = (order_id: number) => {
    setParams({ order: String(order_id) })
    setCash('')
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="print:hidden">
        <div
          role="group"
          aria-label="Filter orders"
          ref={pillsRef}
          className="relative isolate flex flex-wrap gap-2"
        >
          {pills}
          {filters.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={filter === f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors duration-200 pointer-coarse:min-h-11 ${filter === f.value ? `border-brand-charcoal motion-reduce:bg-brand-charcoal text-white ${pillsOn ? 'bg-white' : 'bg-brand-charcoal'}` : 'border-brand-line text-brand-charcoal hover:border-brand-gold bg-white'}`}
            >
              <span className="relative z-10">{f.label}</span>
            </button>
          ))}
        </div>

        {isLoadingError ? (
          <div className="mt-6">
            <LoadError what="the orders" onRetry={() => refetch()} />
          </div>
        ) : (
          <div className="border-brand-line mt-6 overflow-x-auto rounded-lg border bg-white">
            <table className="w-full max-md:block">
              <thead className="bg-brand-cream/60 max-md:hidden">
                <tr>
                  {['Order #', 'Table', 'Time', 'Total', 'Status', 'Payment'].map((h) => (
                    <th key={h} className={th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="max-md:block">
                {orders.map((o) => (
                  <tr
                    key={o.order_id}
                    onClick={() => select(o.order_id)}
                    aria-selected={o.order_id === selectedId}
                    className={`border-brand-line hover:bg-brand-cream/60 cursor-pointer border-t transition-colors duration-150 ${card} ${o.order_id === selectedId ? 'bg-brand-gold/10' : ''} ${flash(o.order_id)}`}
                  >
                    <td className={`${td} font-semibold max-md:flex-1 max-md:p-0`}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          select(o.order_id)
                        }}
                        className="hover:text-brand-red font-semibold pointer-coarse:min-h-11 pointer-coarse:min-w-11 pointer-coarse:text-left"
                      >
                        #{o.order_id}
                      </button>
                    </td>
                    <td className={`${td} ${line}`}>
                      <span className={label}>Table</span>
                      <span>{o.table_number}</span>
                    </td>
                    <td className={`${td} ${line} tabular-nums`}>
                      <span className={label}>Time</span>
                      <span>{time(o.created_at)}</span>
                    </td>
                    <td className={`${td} ${line} tabular-nums`}>
                      <span className={label}>Total</span>
                      <span>{peso(o.total_amount)}</span>
                    </td>
                    <td className={`${td} max-md:p-0`}>
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${orderBadge[o.status]}`}
                      >
                        {cap(o.status)}
                      </span>
                    </td>
                    <td className={`${td} ${line}`}>
                      <span className={label}>Payment</span>
                      <span>{o.payment_status === 'paid' ? 'Paid' : 'Unpaid'}</span>
                    </td>
                  </tr>
                ))}
                {isPending &&
                  Array.from({ length: 5 }, (_, i) => (
                    <tr key={i} className={`border-brand-line border-t ${card}`}>
                      {Array.from({ length: 6 }, (_, j) => (
                        <td key={j} className={`${td} max-md:basis-full max-md:p-0`}>
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))}
                {!isPending && orders.length === 0 && (
                  <tr className="max-md:block">
                    <td colSpan={6} className="max-md:block">
                      <EmptyState icon={ReceiptText} title="No orders here." />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!selected && (
        <p className="border-brand-line text-brand-ink/70 rounded-lg border border-dashed p-6 text-center text-sm print:hidden">
          {selectedId
            ? `Order #${selectedId} isn't in this list. Older unpaid orders are under Unpaid.`
            : 'Select an order to see its details and take payment.'}
        </p>
      )}

      {selected && (
        <div className="hidden print:block">
          <Receipt
            order={selected}
            settings={settings}
            cashReceived={paidCash[selected.order_id] ?? null}
            servedBy={me?.full_name ?? ''}
            printedAt={printedAt}
          />
        </div>
      )}

      {selected && (
        <section
          aria-labelledby="order-title"
          className="border-brand-line rounded-lg border bg-white p-6 print:hidden"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="order-title" className="text-brand-charcoal font-serif text-2xl font-bold">
                Order #{selected.order_id}
              </h2>
              <p className="text-brand-ink/70 mt-1 text-sm">
                Table {selected.table_number} · {time(selected.created_at)}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${selected.payment_status === 'paid' ? 'bg-brand-green text-white' : 'border-brand-line text-brand-charcoal border'}`}
            >
              {selected.payment_status === 'paid'
                ? `Paid${selected.payment_method ? ` · ${cap(selected.payment_method)}` : ''}`
                : 'Unpaid'}
            </span>
          </div>

          <ul className="mt-5 space-y-2 text-sm">
            {selected.items.map((item) => (
              <li key={item.order_item_id} className="flex justify-between gap-4">
                <span className="text-brand-charcoal">
                  {item.quantity}x {item.name}
                  {item.notes && (
                    <span className="text-brand-ink/70 block text-xs">Note: {item.notes}</span>
                  )}
                </span>
                <span className="text-brand-charcoal shrink-0 tabular-nums">
                  {peso(item.unit_price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="border-brand-line mt-5 space-y-2 border-t pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-brand-ink/70">Subtotal</dt>
              <dd className="tabular-nums">{peso(selected.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-brand-ink/70">Service Charge</dt>
              <dd className="tabular-nums">{peso(selected.service_charge)}</dd>
            </div>
            <div className="flex justify-between pt-2">
              <dt className="text-brand-charcoal font-serif text-xl font-bold">Total</dt>
              <dd className="text-brand-red font-serif text-xl font-bold tabular-nums">
                {peso(selected.total_amount)}
              </dd>
            </div>
          </dl>

          {selected.payment_status === 'unpaid' && (
            <div className="mt-6 print:hidden">
              <label className="text-brand-charcoal block text-sm font-bold">
                Cash Received
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={cash}
                  onChange={(e) => setCash(e.target.value)}
                  placeholder="₱0.00"
                  className="border-brand-line focus:border-brand-gold mt-2 block w-full rounded-lg border px-4 py-3 text-sm font-normal outline-none"
                />
              </label>
              <p className="mt-2 flex justify-between text-sm">
                <span className="text-brand-ink/70">Change</span>
                <span className="text-brand-charcoal font-semibold tabular-nums">
                  {peso(Math.max(0, received - selected.total_amount))}
                </span>
              </p>
              {cash !== '' && received < selected.total_amount && (
                <p role="alert" className="text-brand-red mt-1 text-xs">
                  Not enough cash for this order.
                </p>
              )}
              <button
                type="button"
                disabled={received < selected.total_amount || pay.isPending}
                aria-busy={pay.isPending}
                onClick={() => pay.mutate()}
                className="bg-brand-red hover:bg-brand-red/90 lift tracking-label mt-5 flex w-full items-center justify-center gap-2 rounded-lg py-3.5 text-sm font-bold text-white uppercase duration-200 disabled:opacity-50"
              >
                {pay.isPending && <Spinner />}
                Mark Order #{selected.order_id} Paid (Cash)
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              flushSync(() => setPrintedAt(new Date()))
              window.print()
            }}
            className="border-brand-charcoal text-brand-charcoal hover:bg-brand-charcoal mt-3 flex w-full items-center justify-center gap-2 rounded-lg border py-3 text-sm font-bold transition-colors duration-200 hover:text-white print:hidden"
          >
            <Printer className="size-4" />
            Print Receipt
          </button>
        </section>
      )}
    </div>
  )
}
