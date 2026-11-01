import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { Link } from 'react-router-dom'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { getAdminDashboard } from '@/services/dashboard'
import type { OrderStatus } from '@/types/db'

const peso = (amount: number) =>
  `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const th = 'text-brand-ink/70 px-4 py-3 text-left text-xs font-bold tracking-[0.1em] uppercase'
const td = 'text-brand-charcoal px-4 py-3 text-sm'
const card = 'border-brand-line rounded-lg border bg-white'
const orderBadge: Record<OrderStatus, string> = {
  received: 'border-brand-line border bg-white text-brand-charcoal',
  preparing: 'bg-brand-charcoal text-white',
  ready: 'bg-brand-red text-white',
  served: 'bg-brand-ink/10 text-brand-ink',
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export default function AdminDashboard() {
  const { data } = useQuery({
    queryKey: ['dashboard', 'admin'],
    queryFn: getAdminDashboard,
    refetchInterval: 60000,
  })

  if (!data) return null

  const stats = [
    { label: 'Sales Today', value: peso(data.sales_today) },
    { label: 'Orders Today', value: String(data.orders_today) },
    { label: 'Reservations Today', value: String(data.reservations_today) },
    { label: 'No-show Rate', value: `${data.no_show_rate}%` },
  ]
  const chart = data.sales_last_7_days.map((d) => ({
    day: format(parseISO(d.date), 'EEE'),
    date: format(parseISO(d.date), 'MMM d'),
    total: d.total,
  }))

  return (
    <div className="space-y-8">
      <dl className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className={`${card} px-6 py-5`}>
            <dt className="text-brand-ink/70 text-xs font-bold tracking-[0.15em] uppercase">
              {stat.label}
            </dt>
            <dd className="text-brand-charcoal mt-2 font-serif text-4xl tabular-nums">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <section aria-labelledby="sales-title" className={`${card} min-w-0 p-6`}>
          <h2 id="sales-title" className="text-brand-charcoal font-serif text-2xl font-bold">
            Sales (Last 7 Days)
          </h2>
          <div
            role="img"
            aria-label={`Sales for the last 7 days: ${chart.map((d) => `${d.date} ${peso(d.total)}`).join(', ')}`}
            className="mt-4 h-64"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chart} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid
                  stroke="var(--color-brand-line)"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={{ stroke: 'var(--color-brand-line)' }}
                  tick={{ fill: 'var(--color-brand-ink)', fontSize: 12 }}
                />
                <YAxis
                  width={64}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'var(--color-brand-ink)', fontSize: 12 }}
                  tickFormatter={(v: number) => `₱${v.toLocaleString('en-PH')}`}
                />
                <Tooltip
                  formatter={(v) => [peso(Number(v)), 'Sales']}
                  labelFormatter={(_, payload) => payload?.[0]?.payload.date ?? ''}
                  contentStyle={{ borderRadius: 8, borderColor: 'var(--color-brand-line)' }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="var(--color-brand-red)"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: 'var(--color-brand-red)' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section aria-labelledby="best-title" className={`${card} p-6`}>
          <h2 id="best-title" className="text-brand-charcoal font-serif text-2xl font-bold">
            Best Sellers
          </h2>
          <ol className="mt-4 space-y-3">
            {data.best_sellers.map((item, i) => (
              <li key={item.item_id} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-brand-charcoal">
                  <span className="text-brand-gold-deep mr-2 font-serif font-bold">{i + 1}.</span>
                  {item.name}
                </span>
                <span className="text-brand-ink/60 shrink-0 tabular-nums">
                  {item.quantity} sold
                </span>
              </li>
            ))}
            {data.best_sellers.length === 0 && (
              <li className="text-brand-ink/60 text-sm">No sales in the last 30 days.</li>
            )}
          </ol>
        </section>
      </div>

      <section aria-labelledby="recent-title">
        <div className="flex items-end justify-between gap-4">
          <h2 id="recent-title" className="text-brand-charcoal font-serif text-2xl font-bold">
            Recent Orders
          </h2>
          <Link
            to="/admin/orders"
            className="text-brand-red text-xs font-bold tracking-[0.15em] uppercase hover:underline"
          >
            View all
          </Link>
        </div>
        <div className={`${card} mt-3 overflow-hidden`}>
          <table className="w-full">
            <thead className="bg-brand-cream/60">
              <tr>
                {['Order #', 'Date', 'Table', 'Items', 'Total', 'Payment', 'Status'].map((h) => (
                  <th key={h} className={th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.recent_orders.map((o) => (
                <tr key={o.order_id} className="border-brand-line border-t">
                  <td className={`${td} font-semibold`}>
                    <Link to={`/admin/orders?order=${o.order_id}`} className="hover:text-brand-red">
                      #{o.order_id}
                    </Link>
                  </td>
                  <td className={td}>{format(parseISO(o.created_at), 'MMMM d, yyyy')}</td>
                  <td className={td}>{o.table_number}</td>
                  <td className={td}>{o.item_count}</td>
                  <td className={`${td} tabular-nums`}>{peso(o.total_amount)}</td>
                  <td className={td}>
                    {o.payment_status === 'paid'
                      ? `Paid${o.payment_method ? ` · ${cap(o.payment_method)}` : ''}`
                      : 'Unpaid'}
                  </td>
                  <td className={td}>
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${orderBadge[o.status]}`}
                    >
                      {cap(o.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
