import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { Printer } from 'lucide-react'
import { useState } from 'react'
import { flushSync } from 'react-dom'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import Receipt from '@/components/Receipt'
import useOrderEvents, { STAFF_CHANNEL } from '@/hooks/useOrderEvents'
import { listOrders, recordPayment } from '@/services/orders'
import { getMe } from '@/services/auth'
import { getSettings } from '@/services/settings'
import type { OrderStatus } from '@/types/db'

const peso = (amount: number) =>
  `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const th = 'text-brand-ink/70 px-4 py-3 text-left text-xs font-bold tracking-[0.1em] uppercase'
const td = 'text-brand-charcoal px-4 py-3 text-sm'
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
  const [cash, setCash] = useState('')
  const { data: orders = [] } = useQuery({
    queryKey: ['orders', filter],
    queryFn: () =>
      listOrders({
        payment_status: filter || undefined,
        date_from: filter === 'unpaid' ? undefined : format(new Date(), 'yyyy-MM-dd'),
      }),
    refetchInterval: 15000,
  })
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
        <div role="group" aria-label="Filter orders" className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={filter === f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors duration-200 ${filter === f.value ? 'bg-brand-charcoal border-brand-charcoal text-white' : 'border-brand-line text-brand-charcoal hover:border-brand-gold bg-white'}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="border-brand-line mt-6 overflow-x-auto rounded-lg border bg-white">
          <table className="w-full">
            <thead className="bg-brand-cream/60">
              <tr>
                {['Order #', 'Table', 'Time', 'Total', 'Status', 'Payment'].map((h) => (
                  <th key={h} className={th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr
                  key={o.order_id}
                  onClick={() => select(o.order_id)}
                  aria-selected={o.order_id === selectedId}
                  className={`border-brand-line hover:bg-brand-cream/60 cursor-pointer border-t transition-colors duration-150 ${o.order_id === selectedId ? 'bg-brand-gold/10' : ''}`}
                >
                  <td className={`${td} font-semibold`}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        select(o.order_id)
                      }}
                      className="hover:text-brand-red font-semibold"
                    >
                      #{o.order_id}
                    </button>
                  </td>
                  <td className={td}>{o.table_number}</td>
                  <td className={`${td} tabular-nums`}>{time(o.created_at)}</td>
                  <td className={`${td} tabular-nums`}>{peso(o.total_amount)}</td>
                  <td className={td}>
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${orderBadge[o.status]}`}
                    >
                      {cap(o.status)}
                    </span>
                  </td>
                  <td className={td}>{o.payment_status === 'paid' ? 'Paid' : 'Unpaid'}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-brand-ink/70 px-4 py-10 text-center text-sm">
                    No orders here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
                  className="border-brand-line focus:border-brand-gold mt-2 block w-full rounded-md border px-4 py-3 text-sm font-normal outline-none"
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
                onClick={() => pay.mutate()}
                className="bg-brand-red hover:bg-brand-red/90 mt-5 block w-full rounded-md py-3.5 text-sm font-bold tracking-[0.08em] text-white uppercase transition-colors duration-200 disabled:opacity-50"
              >
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
            className="border-brand-charcoal text-brand-charcoal hover:bg-brand-charcoal mt-3 flex w-full items-center justify-center gap-2 rounded-md border py-3 text-sm font-bold transition-colors duration-200 hover:text-white print:hidden"
          >
            <Printer className="size-4" />
            Print Receipt
          </button>
        </section>
      )}
    </div>
  )
}
