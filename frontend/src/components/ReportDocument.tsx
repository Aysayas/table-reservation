import { format, parseISO, startOfWeek } from 'date-fns'
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts'
import { formatTime } from '@/lib/hours'
import type { Report } from '@/services/reports'
import type { RestaurantSettings } from '@/types/db'

type Collections = { total_collected: number; online: number; cash: number; deposits: number }

const peso = (amount: number) =>
  `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const pct = (part: number, whole: number) => (whole ? `${((part / whole) * 100).toFixed(1)}%` : '—')
const long = (iso: string) => format(parseISO(iso), 'MMM d, yyyy')
const th = 'bg-brand-cream px-2 py-1.5 text-left text-[9pt] font-bold tracking-label uppercase'
const num = 'px-2 py-1 text-right tabular-nums'
const cell = 'px-2 py-1'
const zebra = 'even:bg-brand-cream/40 break-inside-avoid'
const totalRow = 'border-brand-charcoal border-t-[1.5px] font-bold'
const heading = 'text-brand-charcoal mt-6 mb-2 font-serif text-[13pt] font-bold break-after-avoid'
const periodName = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' }

export default function ReportDocument({
  report,
  settings,
  collections,
  preparedBy,
  generatedAt,
}: {
  report: Report
  settings?: RestaurantSettings
  collections?: Collections
  preparedBy?: string
  generatedAt: Date
}) {
  const s = report.summary
  const salesTotal = report.sales_over_time.reduce((n, r) => n + r.total, 0)
  const soldTotal = report.best_sellers.reduce((n, b) => n + b.quantity, 0)
  const top = Math.max(0, ...report.sales_over_time.map((r) => r.total))
  const bucket = (start: string) =>
    report.period === 'monthly'
      ? format(parseISO(`${start}-01`), 'MMMM yyyy')
      : report.period === 'weekly'
        ? `Week of ${format(parseISO(start), 'MMM d')}`
        : format(parseISO(start), 'EEE, MMM d')
  const short = (start: string) =>
    report.period === 'monthly'
      ? format(parseISO(`${start}-01`), 'MMM')
      : format(parseISO(start), 'MMM d')
  const keyOf = (date: string) =>
    report.period === 'monthly'
      ? date.slice(0, 7)
      : report.period === 'weekly'
        ? format(startOfWeek(parseISO(date), { weekStartsOn: 1 }), 'yyyy-MM-dd')
        : date
  const bookings = report.sales_over_time.map((r) => ({
    start: r.start,
    count: report.reservations_per_day
      .filter((d) => keyOf(d.date) === r.start)
      .reduce((n, d) => n + d.count, 0),
  }))
  const bookingsTotal = bookings.reduce((n, r) => n + r.count, 0)
  const unit = report.period === 'monthly' ? 'Month' : report.period === 'weekly' ? 'Week' : 'Date'
  const name = settings?.restaurant_name ?? "Vencio's Garden"
  const figures = [
    ['Total Sales', peso(s.total_sales)],
    ['Orders', String(s.total_orders)],
    ['Average Order', peso(s.average_order_value)],
    ['Reservations', String(s.reservations)],
    ['No-shows', `${s.no_shows} (${s.no_show_rate}%)`],
    ['Busiest Hour', s.busiest_hour ? formatTime(s.busiest_hour) : '—'],
  ]

  return (
    <article
      aria-label="Printable sales report"
      data-print="report"
      className="text-brand-charcoal hidden font-sans text-[10pt] [print-color-adjust:exact] print:block"
    >
      <header className="border-brand-gold flex items-center justify-between gap-6 border-b-2 pb-3">
        <img src={settings?.logo_url ?? '/logo.png'} alt={`${name} logo`} className="size-16" />
        <div className="text-right">
          <p className="font-serif text-[18pt] font-bold">{name}</p>
          {settings?.address && <p className="text-brand-ink/80">{settings.address}</p>}
          <p className="text-brand-ink/80">
            {[settings?.contact_number, settings?.email].filter(Boolean).join(' · ')}
          </p>
        </div>
      </header>

      <div className="mt-5 flex items-end justify-between gap-6">
        <div>
          <h2 className="font-serif text-[20pt] font-bold">Sales Report</h2>
          <p>
            {periodName[report.period]} · {long(report.from)} – {long(report.to)}
          </p>
        </div>
        <p className="text-brand-ink/70 text-right text-[9pt]">
          Generated {format(generatedAt, 'MMM d, yyyy, h:mm a')}
          {preparedBy && <> by {preparedBy}</>}
        </p>
      </div>

      <dl className="border-brand-line mt-5 grid break-inside-avoid grid-cols-3 border">
        {figures.map(([label, value], i) => (
          <div
            key={label}
            className={`border-brand-line px-3 py-2.5 ${i % 3 < 2 ? 'border-r' : ''} ${i < 3 ? 'border-b' : ''}`}
          >
            <dt className="text-brand-ink/70 text-[9pt]">{label}</dt>
            <dd className="font-serif text-[15pt] font-bold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      {collections && (
        <section>
          <h3 className={heading}>Collections</h3>
          <table className="w-full border-collapse break-inside-avoid">
            <thead className="table-header-group">
              <tr>
                <th className={th}>Method</th>
                <th className={`${th} text-right`}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {(
                [
                  ['Online', collections.online],
                  ['Cash', collections.cash],
                ] as const
              ).map(([label, value]) => (
                <tr key={label} className={zebra}>
                  <td className={cell}>{label}</td>
                  <td className={num}>{peso(value)}</td>
                </tr>
              ))}
              <tr className={totalRow}>
                <td className={cell}>Total collected</td>
                <td className={num}>{peso(collections.total_collected)}</td>
              </tr>
              <tr className="text-brand-ink/70">
                <td className={cell}>Of which deposits</td>
                <td className={num}>{peso(collections.deposits)}</td>
              </tr>
            </tbody>
          </table>
        </section>
      )}

      <section>
        <h3 className={heading}>Sales Over Time</h3>
        <div role="img" aria-label="Sales over time chart" className="mb-3 break-inside-avoid">
          <BarChart
            width={640}
            height={170}
            data={report.sales_over_time.map((r) => ({ ...r, label: short(r.start) }))}
            margin={{ top: 6, right: 8, bottom: 0, left: 0 }}
          >
            <CartesianGrid stroke="var(--color-brand-line)" vertical={false} />
            <XAxis dataKey="label" tickLine={false} tick={{ fontSize: 10 }} minTickGap={8} />
            <YAxis
              width={60}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10 }}
              tickFormatter={(v: number) => `₱${v.toLocaleString('en-PH')}`}
            />
            <Bar dataKey="total" isAnimationActive={false} radius={[2, 2, 0, 0]}>
              {report.sales_over_time.map((r) => (
                <Cell
                  key={r.start}
                  fill={
                    top > 0 && r.total === top
                      ? 'var(--color-brand-gold-deep)'
                      : 'var(--color-brand-charcoal)'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </div>
        <table className="w-full border-collapse break-inside-avoid">
          <thead className="table-header-group">
            <tr>
              <th className={th}>
                {report.period === 'monthly'
                  ? 'Month'
                  : report.period === 'weekly'
                    ? 'Week'
                    : 'Date'}
              </th>
              <th className={`${th} text-right`}>Sales</th>
              <th className={`${th} text-right`}>% of Total</th>
            </tr>
          </thead>
          <tbody>
            {report.sales_over_time.map((r) => (
              <tr key={r.start} className={zebra}>
                <td className={cell}>{bucket(r.start)}</td>
                <td className={num}>{peso(r.total)}</td>
                <td className={num}>{pct(r.total, salesTotal)}</td>
              </tr>
            ))}
            <tr className={totalRow}>
              <td className={cell}>Total</td>
              <td className={num}>{peso(salesTotal)}</td>
              <td className={num}>{salesTotal ? '100%' : '—'}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h3 className={heading}>Best Sellers</h3>
        <table className="w-full border-collapse break-inside-avoid">
          <thead className="table-header-group">
            <tr>
              <th className={`${th} w-10`}>#</th>
              <th className={th}>Dish</th>
              <th className={`${th} text-right`}>Quantity</th>
              <th className={`${th} text-right`}>% of Sold</th>
            </tr>
          </thead>
          <tbody>
            {report.best_sellers.map((b, i) => (
              <tr key={b.item_id} className={zebra}>
                <td className={cell}>{i + 1}</td>
                <td className={cell}>{b.name}</td>
                <td className={num}>{b.quantity}</td>
                <td className={num}>{pct(b.quantity, soldTotal)}</td>
              </tr>
            ))}
            {!report.best_sellers.length && (
              <tr>
                <td colSpan={4} className={`${cell} text-brand-ink/70`}>
                  No paid orders in this range.
                </td>
              </tr>
            )}
            <tr className={totalRow}>
              <td className={cell} />
              <td className={cell}>Total</td>
              <td className={num}>{soldTotal}</td>
              <td className={num}>{soldTotal ? '100%' : '—'}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h3 className={heading}>
          {report.period === 'daily' ? 'Reservations per Day' : `Reservations per ${unit}`}
        </h3>
        <table className="w-full border-collapse break-inside-avoid">
          <thead className="table-header-group">
            <tr>
              <th className={th}>{unit}</th>
              <th className={`${th} text-right`}>Bookings</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((r) => (
              <tr key={r.start} className={zebra}>
                <td className={cell}>{bucket(r.start)}</td>
                <td className={num}>{r.count}</td>
              </tr>
            ))}
            <tr className={totalRow}>
              <td className={cell}>Total</td>
              <td className={num}>{bookingsTotal}</td>
            </tr>
            <tr className="text-brand-ink/70">
              <td className={cell}>No-shows</td>
              <td className={num}>
                {s.no_shows} ({s.no_show_rate}%)
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <p className="text-brand-ink/60 border-brand-line mt-8 border-t pt-2 text-[8pt]">
        System-generated report from the {name} reservation and ordering system. No signature
        required.
      </p>
    </article>
  )
}
