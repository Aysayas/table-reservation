import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { differenceInMinutes, format, parseISO } from 'date-fns'
import { LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { listOrders, updateOrderStatus, type StaffOrder } from '@/services/orders'
import type { OrderStatus } from '@/types/db'

const columns = [
  {
    status: 'received',
    title: 'Received',
    next: 'preparing',
    action: 'Start Preparing',
    top: 'border-t-brand-ink/40',
    count: 'bg-brand-ink/10 text-brand-ink',
    button:
      'border-brand-charcoal text-brand-charcoal hover:bg-brand-charcoal border-2 bg-white hover:text-white',
  },
  {
    status: 'preparing',
    title: 'Preparing',
    next: 'ready',
    action: 'Mark Ready',
    top: 'border-t-brand-gold',
    count: 'bg-brand-gold/20 text-brand-gold-deep',
    button: 'bg-brand-charcoal hover:bg-brand-charcoal/90 text-white',
  },
  {
    status: 'ready',
    title: 'Ready',
    next: 'served',
    action: 'Mark Served',
    top: 'border-t-brand-red',
    count: 'bg-brand-red text-white',
    button: 'bg-brand-red hover:bg-brand-red/90 text-white',
  },
] as const satisfies {
  status: OrderStatus
  title: string
  next: OrderStatus
  action: string
  top: string
  count: string
  button: string
}[]

const ages = [
  { label: 'On time', chip: 'bg-brand-green/10 text-brand-green' },
  { label: '10+ min', chip: 'bg-brand-gold/20 text-brand-gold-deep' },
  { label: '15+ min', chip: 'bg-brand-red/10 text-brand-red' },
]
const ageOf = (minutes: number) => ages[minutes >= 15 ? 2 : minutes >= 10 ? 1 : 0]
const waited = (minutes: number) =>
  minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`

export default function KitchenDisplay() {
  const queryClient = useQueryClient()
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(id)
  }, [])
  const { data: orders = [] } = useQuery({
    queryKey: ['orders', 'kitchen'],
    queryFn: () => listOrders({ status: ['received', 'preparing', 'ready'] }),
    refetchInterval: 15000,
  })
  const move = useMutation({
    mutationFn: ({ order, next }: { order: StaffOrder; next: OrderStatus }) =>
      updateOrderStatus(order.order_id, next),
    onSuccess: (order) => {
      toast.success(`Order #${order.order_id} is now ${order.status}`)
      for (const key of ['orders', 'tables', 'dashboard']) {
        queryClient.invalidateQueries({ queryKey: [key] })
      }
    },
    onError: (e) => toast.error(e.message),
  })
  const oldestFirst = [...orders].reverse()

  return (
    <div className="bg-brand-cream flex min-h-screen flex-col">
      <header className="bg-brand-charcoal flex flex-wrap items-center gap-x-6 gap-y-3 px-6 py-4 text-white md:px-8">
        <h1 className="font-serif text-2xl">Kitchen Display</h1>
        <ul aria-label="Waiting time" className="flex flex-wrap gap-2">
          {ages.map((age) => (
            <li key={age.label} className="rounded-full bg-white">
              <span
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${age.chip}`}
              >
                <span className="size-1.5 rounded-full bg-current" />
                {age.label}
              </span>
            </li>
          ))}
        </ul>
        <p className="font-serif text-xl tabular-nums md:ml-auto">{format(now, 'h:mm a')}</p>
        <Link
          to="/staff/login"
          className="ml-auto flex items-center gap-2 text-sm text-white/70 transition-colors duration-200 hover:text-white md:ml-0"
        >
          <LogOut className="size-4" />
          Log Out
        </Link>
      </header>

      <main className="grid flex-1 items-start gap-5 p-4 md:p-6 lg:grid-cols-3">
        {columns.map((column) => {
          const list = oldestFirst.filter((o) => o.status === column.status)
          return (
            <section
              key={column.status}
              aria-labelledby={`col-${column.status}`}
              className={`border-brand-line rounded-xl border border-t-4 bg-white/50 p-5 lg:min-h-[70vh] ${column.top}`}
            >
              <h2
                id={`col-${column.status}`}
                className="text-brand-charcoal flex items-center justify-between font-serif text-2xl"
              >
                {column.title}
                <span
                  aria-label={`(${list.length})`}
                  className={`grid size-8 place-items-center rounded-full font-sans text-sm font-bold ${column.count}`}
                >
                  {list.length}
                </span>
              </h2>
              <ul className="mt-4 space-y-4">
                {list.map((order) => {
                  const minutes = differenceInMinutes(now, parseISO(order.created_at))
                  return (
                    <li
                      key={order.order_id}
                      aria-label={`Order #${order.order_id}`}
                      className="border-brand-line/60 rounded-xl border bg-white p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-brand-charcoal font-serif text-3xl font-bold">
                            Table {order.table_number}
                          </p>
                          <p className="text-brand-ink/60 mt-1">Order #{order.order_id}</p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold tabular-nums ${ageOf(minutes).chip}`}
                        >
                          {waited(minutes)}
                        </span>
                      </div>
                      <ul className="mt-4 space-y-2 text-lg">
                        {order.items.map((item) => (
                          <li key={item.order_item_id} className="text-brand-charcoal">
                            <p className="grid grid-cols-[3rem_1fr]">
                              <span className="font-bold">{item.quantity}×</span>
                              {item.name}
                            </p>
                            {item.notes && (
                              <p className="bg-brand-red/10 text-brand-red mt-2 inline-block rounded-md px-3 py-1 text-base font-bold">
                                {item.notes}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        disabled={move.isPending}
                        onClick={() => move.mutate({ order, next: column.next })}
                        className={`mt-5 block w-full rounded-lg py-3.5 text-base font-bold tracking-wide transition-colors duration-200 disabled:opacity-50 ${column.button}`}
                      >
                        {column.action}
                      </button>
                    </li>
                  )
                })}
                {list.length === 0 && (
                  <li className="border-brand-line text-brand-ink/50 rounded-xl border border-dashed py-10 text-center italic">
                    No orders here. New orders appear automatically.
                  </li>
                )}
              </ul>
            </section>
          )
        })}
      </main>
    </div>
  )
}
