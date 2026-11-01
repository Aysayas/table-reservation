import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { formatTime } from '@/lib/hours'
import { getStaffDashboard } from '@/services/dashboard'
import type { OrderStatus, ReservationStatus } from '@/types/db'

const peso = (amount: number) =>
  `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const th = 'text-brand-ink/70 px-4 py-3 text-left text-xs font-bold tracking-[0.1em] uppercase'
const td = 'text-brand-charcoal px-4 py-3 text-sm'
const badge = 'inline-block rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap'

const reservationBadge: Record<ReservationStatus, string> = {
  pending: 'bg-brand-gold/20 text-brand-gold-deep',
  confirmed: 'bg-brand-green/10 text-brand-green',
  arrived: 'bg-brand-charcoal text-white',
  no_show: 'bg-brand-ink/10 text-brand-ink',
  cancelled: 'bg-brand-red/10 text-brand-red',
}
const orderBadge: Record<OrderStatus, string> = {
  received: 'border-brand-line border bg-white text-brand-charcoal',
  preparing: 'bg-brand-charcoal text-white',
  ready: 'bg-brand-red text-white',
  served: 'bg-brand-ink/10 text-brand-ink',
}
const label = (status: string) =>
  status === 'no_show' ? 'No-show' : status.charAt(0).toUpperCase() + status.slice(1)

function Panel({ title, to, children }: { title: string; to: string; children: React.ReactNode }) {
  const id = title.toLowerCase().replace(/\s+/g, '-')
  return (
    <section aria-labelledby={id} className="min-w-0">
      <div className="flex items-end justify-between gap-4">
        <h2 id={id} className="text-brand-charcoal font-serif text-2xl font-bold">
          {title}
        </h2>
        <Link
          to={to}
          className="text-brand-red text-xs font-bold tracking-[0.15em] uppercase hover:underline"
        >
          View all
        </Link>
      </div>
      <div className="border-brand-line mt-3 overflow-x-auto rounded-lg border bg-white">
        {children}
      </div>
    </section>
  )
}

export default function StaffDashboard() {
  const { data } = useQuery({
    queryKey: ['dashboard', 'staff'],
    queryFn: getStaffDashboard,
    refetchInterval: 30000,
  })

  if (!data) return null

  const stats = [
    { label: 'Reservations Today', value: String(data.reservations_today) },
    { label: 'Guests Arrived', value: String(data.guests_arrived) },
    { label: 'Active Orders', value: String(data.active_orders) },
    { label: 'Available Tables', value: `${data.available_tables} / ${data.total_tables}` },
  ]

  return (
    <div className="space-y-8">
      <dl className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="border-brand-line rounded-lg border bg-white px-6 py-5">
            <dt className="text-brand-ink/70 text-xs font-bold tracking-[0.15em] uppercase">
              {stat.label}
            </dt>
            <dd className="text-brand-charcoal mt-2 font-serif text-4xl">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-8 xl:grid-cols-2">
        <Panel title="Upcoming Reservations" to="/staff/reservations">
          <table className="w-full">
            <thead className="bg-brand-cream/60">
              <tr>
                <th className={th}>Time</th>
                <th className={th}>Name</th>
                <th className={th}>Guests</th>
                <th className={th}>Table</th>
                <th className={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.upcoming_reservations.map((r) => (
                <tr key={r.reservation_id} className="border-brand-line border-t">
                  <td className={`${td} tabular-nums`}>{formatTime(r.reservation_time)}</td>
                  <td className={td}>{r.full_name}</td>
                  <td className={td}>{r.pax}</td>
                  <td className={td}>{r.table_number ?? '—'}</td>
                  <td className={td}>
                    <span className={`${badge} ${reservationBadge[r.status]}`}>
                      {label(r.status)}
                    </span>
                  </td>
                </tr>
              ))}
              {data.upcoming_reservations.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-brand-ink/60 px-4 py-8 text-center text-sm">
                    No more reservations today.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Panel>

        <Panel title="Active Orders" to="/staff/orders">
          <table className="w-full">
            <thead className="bg-brand-cream/60">
              <tr>
                <th className={th}>Order #</th>
                <th className={th}>Table</th>
                <th className={th}>Items</th>
                <th className={th}>Total</th>
                <th className={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.active_orders_list.map((o) => (
                <tr key={o.order_id} className="border-brand-line border-t">
                  <td className={`${td} font-semibold`}>
                    <Link to={`/staff/orders?order=${o.order_id}`} className="hover:text-brand-red">
                      #{o.order_id}
                    </Link>
                  </td>
                  <td className={td}>{o.table_number}</td>
                  <td className={td}>{o.item_count}</td>
                  <td className={`${td} tabular-nums`}>{peso(o.total_amount)}</td>
                  <td className={td}>
                    <span className={`${badge} ${orderBadge[o.status]}`}>{label(o.status)}</span>
                  </td>
                </tr>
              ))}
              {data.active_orders_list.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-brand-ink/60 px-4 py-8 text-center text-sm">
                    No active orders.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  )
}
