import { useQuery, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { Check } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import useOrderEvents from '@/hooks/useOrderEvents'
import usePaymentReturn, { markPaying } from '@/hooks/usePaymentReturn'
import { apiError } from '@/lib/api'
import { readLastOrder, readTableToken } from '@/lib/tableToken'
import { getOrder, payOrder } from '@/services/orders'
import type { OrderStatus as Status } from '@/types/db'

const peso = (amount: number) =>
  `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const steps: { status: Status; label: string }[] = [
  { status: 'received', label: 'Received' },
  { status: 'preparing', label: 'Preparing' },
  { status: 'ready', label: 'Ready' },
  { status: 'served', label: 'Served' },
]

export default function OrderStatus() {
  const { tableId = '' } = useParams()
  const table = Number(tableId)
  const [params] = useSearchParams()
  const orderId = Number(params.get('order')) || readLastOrder(table) || 0
  const token = readTableToken(table) ?? ''
  const queryClient = useQueryClient()
  const [paying, setPaying] = useState(false)
  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId, token],
    queryFn: () => getOrder(orderId, token),
    enabled: orderId > 0,
    refetchInterval: (query) => (query.state.data?.payment_status === 'unpaid' ? 5000 : 15000),
  })
  useOrderEvents(order?.channel, ['order', orderId])
  const { confirming } = usePaymentReturn(`order:${orderId}`, order?.payment_status === 'paid')
  const payNow = async () => {
    setPaying(true)
    try {
      const pay = await payOrder(orderId, token)
      if (pay) {
        markPaying(`order:${orderId}`)
        window.location.assign(pay.checkout_url)
        return
      }
      await queryClient.invalidateQueries({ queryKey: ['order', orderId] })
    } catch (e) {
      toast.error(apiError(e, "Couldn't start the payment. Please try again."))
    }
    setPaying(false)
  }
  const menuLink = `/table/${table}/menu`
  const orderMore = (
    <Link
      to={menuLink}
      className="border-brand-charcoal text-brand-charcoal hover:bg-brand-charcoal block w-full rounded-lg border bg-white py-4 text-center text-sm font-bold tracking-[0.1em] uppercase transition-colors duration-200 hover:text-white"
    >
      Order More
    </Link>
  )

  if (orderId > 0 && isLoading) return null

  if (!order) {
    return (
      <div className="bg-brand-cream min-h-[calc(100dvh-4rem)] px-4 py-16 text-center">
        <h1 className="text-brand-charcoal font-serif text-3xl">Order not found</h1>
        <p className="text-brand-ink/75 mt-3 text-sm">
          We couldn't find this order for your table. Ask our staff if you need help.
        </p>
        <div className="mt-8">{orderMore}</div>
      </div>
    )
  }

  const current = steps.findIndex((s) => s.status === order.status)

  return (
    <div className="bg-brand-cream short:pb-6 min-h-[calc(100dvh-4rem)] px-4 pt-6 pb-28">
      <h1 className="text-brand-charcoal font-serif text-3xl">Order #{order.order_id}</h1>
      <p className="text-brand-ink/70 mt-1 text-sm">
        Placed at {format(parseISO(order.created_at), 'h:mm a')}
      </p>

      <ol aria-label="Order progress" className="mt-6">
        {steps.map((step, index) => {
          const done = index < current || order.status === 'served'
          const now = index === current && order.status !== 'served'
          return (
            <li
              key={step.status}
              aria-current={now ? 'step' : undefined}
              className="relative flex items-center gap-4 pb-8 last:pb-0"
            >
              {index < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`absolute top-8 left-4 h-[calc(100%-2rem)] w-px -translate-x-1/2 ${index < current ? 'bg-brand-red' : 'bg-brand-line'}`}
                />
              )}
              <span
                className={`relative flex size-8 shrink-0 items-center justify-center rounded-full border-2 ${done ? 'bg-brand-red border-brand-red text-white' : now ? 'border-brand-red bg-white' : 'border-brand-line bg-white'}`}
              >
                {done ? (
                  <Check className="size-4" />
                ) : now ? (
                  <span className="bg-brand-red size-3 rounded-full motion-safe:animate-pulse" />
                ) : null}
              </span>
              <span
                className={`flex-1 text-sm ${now ? 'text-brand-charcoal font-bold' : done ? 'text-brand-charcoal' : 'text-brand-ink/50'}`}
              >
                {step.label}
              </span>
              <span className="text-brand-ink/60 text-xs">
                {index === 0
                  ? format(parseISO(order.created_at), 'h:mm a')
                  : now
                    ? 'In progress'
                    : ''}
              </span>
            </li>
          )
        })}
      </ol>

      <section
        aria-labelledby="your-items"
        className="border-brand-line mt-8 rounded-lg border bg-white p-5"
      >
        <h2 id="your-items" className="text-brand-charcoal font-serif text-xl">
          Your Items
        </h2>
        <ul className="mt-4 space-y-2 text-sm">
          {order.items.map((item) => (
            <li key={item.order_item_id} className="flex justify-between gap-4">
              <span className="text-brand-charcoal">
                {item.quantity}x {item.name}
                {item.notes && (
                  <span className="text-brand-ink/60 block text-xs">Note: {item.notes}</span>
                )}
              </span>
              <span className="text-brand-charcoal shrink-0">
                {peso(item.unit_price * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <div className="border-brand-line mt-4 flex justify-between border-t pt-3">
          <span className="text-brand-charcoal font-serif text-lg">Total</span>
          <span className="text-brand-red font-serif text-lg">{peso(order.total_amount)}</span>
        </div>
      </section>

      <div className="bg-brand-charcoal mt-4 rounded-lg px-5 py-4 text-white">
        <p className="text-brand-gold text-xs font-bold tracking-[0.15em] uppercase">Payment</p>
        <p className="mt-1 text-sm font-semibold">
          {order.payment_status === 'paid'
            ? 'Paid'
            : confirming
              ? 'Checking your payment…'
              : 'Unpaid · Pay at the counter'}
        </p>
        {order.payment_status === 'unpaid' && !confirming && token && (
          <button
            type="button"
            disabled={paying}
            onClick={payNow}
            className="bg-brand-red hover:bg-brand-red/90 focus-visible:outline-brand-gold mt-3 block w-full rounded-lg py-3 text-sm font-bold tracking-[0.1em] uppercase transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60"
          >
            Pay Now
          </button>
        )}
      </div>

      <div className="short:static short:mt-4 short:pb-0 short:px-0 fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[390px] px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {orderMore}
      </div>
    </div>
  )
}
