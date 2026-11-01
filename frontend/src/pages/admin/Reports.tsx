import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { Printer } from 'lucide-react'
import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatTime } from '@/lib/hours'
import { defaultRange, getReport, type ReportPeriod } from '@/services/reports'

const peso = (amount: number) =>
  `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const card = 'border-brand-line rounded-xl border bg-white p-6 break-inside-avoid'
const title = 'text-brand-charcoal font-serif text-xl font-bold'
const axis = { fill: 'var(--color-brand-ink)', fontSize: 12 }
const periods: { value: ReportPeriod; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]
const long = (iso: string) => format(parseISO(iso), 'MMM d, yyyy')

export default function Reports() {
  const [period, setPeriod] = useState<ReportPeriod>('daily')
  const [range, setRange] = useState(() => defaultRange('daily'))
  const { data, error } = useQuery({
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
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors duration-200 ${period === p.value ? 'bg-brand-charcoal border-brand-charcoal text-white' : 'border-brand-line text-brand-charcoal hover:border-brand-gold bg-white'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="border-brand-line flex flex-wrap items-center gap-2 rounded-lg border bg-white px-3 py-1.5 text-sm">
          <label className="flex items-center gap-2">
            <span className="text-brand-ink/60 text-xs font-bold uppercase">From</span>
            <input
              type="date"
              value={range.from}
              max={range.to}
              onChange={(e) => e.target.value && setRange({ ...range, from: e.target.value })}
              className="outline-none"
            />
          </label>
          <span className="text-brand-ink/40">–</span>
          <label className="flex items-center gap-2">
            <span className="text-brand-ink/60 text-xs font-bold uppercase">To</span>
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
          onClick={() => window.print()}
          className="border-brand-charcoal text-brand-charcoal hover:bg-brand-charcoal ml-auto flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-bold transition-colors duration-200 hover:text-white"
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
                <Tooltip formatter={(v) => [peso(Number(v)), 'Sales']} />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="var(--color-brand-red)"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: 'var(--color-brand-red)' }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section aria-labelledby="best-title" className={card}>
          <h2 id="best-title" className={title}>
            Best-Selling Items
          </h2>
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
                <Tooltip formatter={(v) => [`${v} sold`, 'Sold']} />
                <Bar
                  dataKey="quantity"
                  fill="var(--color-brand-gold)"
                  radius={[0, 4, 4, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section aria-labelledby="bookings-title" className={card}>
          <h2 id="bookings-title" className={title}>
            Reservations per Day
          </h2>
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
                <Tooltip formatter={(v) => [String(v), 'Reservations']} />
                <Bar
                  dataKey="count"
                  fill="var(--color-brand-charcoal)"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section aria-labelledby="summary-title" className={card}>
          <h2 id="summary-title" className={title}>
            Summary
          </h2>
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
