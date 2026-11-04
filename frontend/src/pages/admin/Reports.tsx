import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { Download, Printer } from 'lucide-react'
import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Skeleton from '@/components/Skeleton'
import { downloadCsv } from '@/lib/csv'
import { formatTime } from '@/lib/hours'
import { defaultRange, getReport, type ReportPeriod } from '@/services/reports'

const peso = (amount: number) =>
  `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const card = 'border-brand-line rounded-xl border bg-white p-6 break-inside-avoid'
const title = 'text-brand-charcoal font-serif text-xl font-bold'
const axis = { fill: 'var(--color-brand-ink)', fillOpacity: 0.7, fontSize: 12 }
const ink = 'var(--color-brand-charcoal)'
const peak = 'var(--color-brand-gold-deep)'
const tip = {
  contentStyle: {
    background: 'var(--color-brand-charcoal)',
    border: 'none',
    borderRadius: 6,
    fontFamily: 'var(--font-sans)',
    fontSize: 13,
  },
  labelStyle: { color: 'var(--color-brand-gold)', fontWeight: 700 },
  itemStyle: { color: 'white' },
  cursor: { fill: 'var(--color-brand-cream)', stroke: 'var(--color-brand-line)' },
}
const periods: { value: ReportPeriod; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const long = (iso: string) => format(parseISO(iso), 'MMM d, yyyy')

export default function Reports() {
  const [period, setPeriod] = useState<ReportPeriod>('daily')
  const [range, setRange] = useState(() => defaultRange('daily'))
  const { data, isPending, error } = useQuery({
    queryKey: ['reports', period, range],
    queryFn: () => getReport({ period, ...range }),
  })

  const choose = (p: ReportPeriod) => {
    setPeriod(p)
    setRange(defaultRange(p))
  }
  const label = (start: string) =>
    period === 'monthly'
      ? format(parseISO(`${start}-01`), 'MMM')
      : period === 'weekly'
        ? format(parseISO(start), 'MMM d')
        : format(parseISO(start), 'EEE d')

  const sales = (data?.sales_over_time ?? []).map((s) => ({ ...s, label: label(s.start) }))
  const bookings = (data?.reservations_per_day ?? []).map((r) => ({
    ...r,
    label: format(parseISO(r.date), 'MMM d'),
  }))
  const best = data?.best_sellers ?? []
  const topSales = Math.max(0, ...sales.map((s) => s.total))
  const topBest = Math.max(0, ...best.map((b) => b.quantity))
  const topBookings = Math.max(0, ...bookings.map((b) => b.count))
  const s = data?.summary
  const summary = s
    ? [
        ['Total Sales', peso(s.total_sales)],
        ['Total Orders', String(s.total_orders)],
        ['Average Order Value', peso(s.average_order_value)],
        ['Reservations', String(s.reservations)],
        ['No-shows', `${s.no_shows} (${s.no_show_rate}%)`],
        ['Busiest Hour', s.busiest_hour ? formatTime(s.busiest_hour) : '—'],
      ]
    : []

  const exportCsv = () =>
    downloadCsv(`vencios-report-${range.from}-to-${range.to}.csv`, [
      ["Vencio's Garden Sales Report"],
      ['Period', cap(period)],
      ['From', range.from],
      ['To', range.to],
      [],
      ['Summary'],
      ...summary,
      [],
      ['Sales Over Time'],
      [period === 'monthly' ? 'Month' : period === 'weekly' ? 'Week Of' : 'Date', 'Sales'],
      ...(data?.sales_over_time ?? []).map((r) => [r.start, r.total.toFixed(2)]),
      ['Total', (data?.sales_over_time ?? []).reduce((n, r) => n + r.total, 0).toFixed(2)],
      [],
      ['Best Sellers'],
      ['Rank', 'Dish', 'Quantity'],
      ...best.map((b, i) => [i + 1, b.name, b.quantity]),
      ['', 'Total', best.reduce((n, b) => n + b.quantity, 0)],
      [],
      ['Reservations Per Day'],
      ['Date', 'Bookings'],
      ...(data?.reservations_per_day ?? []).map((r) => [r.date, r.count]),
      ['Total', (data?.reservations_per_day ?? []).reduce((n, r) => n + r.count, 0)],
    ])

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <div role="group" aria-label="Report period" className="flex flex-wrap gap-2">
          {periods.map((p) => (
            <button
              key={p.value}
              type="button"
              aria-pressed={period === p.value}
              onClick={() => choose(p.value)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors duration-200 pointer-coarse:min-h-11 ${period === p.value ? 'bg-brand-charcoal border-brand-charcoal text-white' : 'border-brand-line text-brand-charcoal hover:border-brand-gold bg-white'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="border-brand-line flex flex-wrap items-center gap-2 rounded-lg border bg-white px-3 py-1.5 text-sm">
          <label className="flex items-center gap-2">
            <span className="text-brand-ink/70 text-xs font-bold uppercase">From</span>
            <input
              type="date"
              value={range.from}
              max={range.to}
              onChange={(e) => e.target.value && setRange({ ...range, from: e.target.value })}
              className="outline-none"
            />
          </label>
          <span className="text-brand-ink/70">–</span>
          <label className="flex items-center gap-2">
            <span className="text-brand-ink/70 text-xs font-bold uppercase">To</span>
            <input
              type="date"
              value={range.to}
              min={range.from}
              onChange={(e) => e.target.value && setRange({ ...range, to: e.target.value })}
              className="outline-none"
            />
          </label>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={!data}
          className="border-brand-charcoal text-brand-charcoal hover:bg-brand-charcoal ml-auto flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-bold transition-colors duration-200 hover:text-white disabled:opacity-50"
        >
          <Download className="size-4" />
          Download CSV
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="border-brand-charcoal text-brand-charcoal hover:bg-brand-charcoal flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-bold transition-colors duration-200 hover:text-white"
        >
          <Printer className="size-4" />
          Print
        </button>
      </div>

      <p className="text-brand-charcoal hidden font-serif text-2xl font-bold print:block">
        Report: {long(range.from)} – {long(range.to)}
      </p>

      {error && (
        <p role="alert" className="text-brand-red mt-4 text-sm">
          {error.message}
        </p>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-2 print:grid-cols-2">
        <section aria-labelledby="sales-title" className={card}>
          <h2 id="sales-title" className={title}>
            Sales Over Time
          </h2>
          {isPending ? (
            <Skeleton className="mt-4 h-64" />
          ) : (
            <div
              role="img"
              aria-label={`Sales over time: ${sales.map((d) => `${d.label} ${peso(d.total)}`).join(', ')}`}
              className="mt-4 h-64"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sales} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid
                    stroke="var(--color-brand-line)"
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis dataKey="label" tickLine={false} tick={axis} />
                  <YAxis
                    width={64}
                    tickLine={false}
                    axisLine={false}
                    tick={axis}
                    tickFormatter={(v: number) => `₱${v.toLocaleString('en-PH')}`}
                  />
                  <Tooltip {...tip} formatter={(v) => [peso(Number(v)), 'Sales']} />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke={ink}
                    strokeWidth={2}
                    dot={({ cx, cy, payload }) => (
                      <circle
                        key={`${cx}-${cy}`}
                        cx={cx}
                        cy={cy}
                        r={topSales > 0 && payload.total === topSales ? 6 : 4}
                        fill={topSales > 0 && payload.total === topSales ? peak : ink}
                        stroke="white"
                        strokeWidth={2}
                      />
                    )}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section aria-labelledby="best-title" className={card}>
          <h2 id="best-title" className={title}>
            Best-Selling Items
          </h2>
          {isPending ? (
            <Skeleton className="mt-4 h-64" />
          ) : (
            <div
              role="img"
              aria-label={`Best-selling items: ${best.map((b) => `${b.name} ${b.quantity} sold`).join(', ') || 'none'}`}
              className="mt-4 h-64"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={best}
                  layout="vertical"
                  margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
                >
                  <CartesianGrid
                    stroke="var(--color-brand-line)"
                    strokeDasharray="3 3"
                    horizontal={false}
                  />
                  <XAxis type="number" allowDecimals={false} tickLine={false} tick={axis} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={150}
                    tickLine={false}
                    axisLine={false}
                    tick={axis}
                  />
                  <Tooltip {...tip} formatter={(v) => [`${v} sold`, 'Sold']} />
                  <Bar
                    dataKey="quantity"
                    fill={ink}
                    radius={[0, 4, 4, 0]}
                    isAnimationActive={false}
                  >
                    {best.map((b) => (
                      <Cell key={b.name} fill={b.quantity === topBest ? peak : ink} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section aria-labelledby="bookings-title" className={card}>
          <h2 id="bookings-title" className={title}>
            Reservations per Day
          </h2>
          {isPending ? (
            <Skeleton className="mt-4 h-64" />
          ) : (
            <div
              role="img"
              aria-label={`Reservations per day: ${bookings.map((b) => `${b.label} ${b.count}`).join(', ')}`}
              className="mt-4 h-64"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bookings} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid
                    stroke="var(--color-brand-line)"
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis dataKey="label" tickLine={false} tick={axis} minTickGap={12} />
                  <YAxis
                    width={32}
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tick={axis}
                  />
                  <Tooltip {...tip} formatter={(v) => [String(v), 'Reservations']} />
                  <Bar dataKey="count" fill={ink} radius={[4, 4, 0, 0]} isAnimationActive={false}>
                    {bookings.map((b) => (
                      <Cell
                        key={b.label}
                        fill={topBookings > 0 && b.count === topBookings ? peak : ink}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section aria-labelledby="summary-title" className={card}>
          <h2 id="summary-title" className={title}>
            Summary
          </h2>
          {isPending && (
            <div className="mt-4 space-y-5 py-1">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-5" />
              ))}
            </div>
          )}
          <dl className="mt-4">
            {summary.map(([term, value]) => (
              <div
                key={term}
                className="border-brand-line/70 flex items-baseline justify-between border-b py-3 last:border-b-0"
              >
                <dt className="text-brand-ink/70 text-sm">{term}</dt>
                <dd className="text-brand-charcoal font-serif text-lg font-bold tabular-nums">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  )
}
