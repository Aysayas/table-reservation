import {
  addDays,
  addMonths,
  addWeeks,
  differenceInCalendarDays,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from 'date-fns'
import { api, USE_SAMPLE } from '@/lib/api'
import {
  sampleMenuItems,
  sampleOrderItems,
  sampleOrders,
  samplePayments,
  sampleReservations,
} from '@/services/sampleData'

export type ReportPeriod = 'daily' | 'weekly' | 'monthly'

export type Report = {
  period: ReportPeriod
  from: string
  to: string
  sales_over_time: { start: string; total: number }[]
  best_sellers: { item_id: number; name: string; quantity: number }[]
  reservations_per_day: { date: string; count: number }[]
  summary: {
    total_sales: number
    total_orders: number
    average_order_value: number
    reservations: number
    no_shows: number
    no_show_rate: number
    busiest_hour: string | null
  }
}

const day = (d: Date) => format(d, 'yyyy-MM-dd')

export function defaultRange(period: ReportPeriod, today = new Date()) {
  if (period === 'weekly') {
    return { from: day(subWeeks(startOfWeek(today, { weekStartsOn: 1 }), 7)), to: day(today) }
  }
  if (period === 'monthly') return { from: day(subMonths(startOfMonth(today), 5)), to: day(today) }
  return { from: day(subDays(today, 6)), to: day(today) }
}

const bucketOf = (period: ReportPeriod, date: Date) =>
  period === 'monthly'
    ? format(date, 'yyyy-MM')
    : period === 'weekly'
      ? day(startOfWeek(date, { weekStartsOn: 1 }))
      : day(date)

export async function getReport(query: {
  period: ReportPeriod
  from?: string
  to?: string
}): Promise<Report> {
  if (!USE_SAMPLE) {
    const res = await api.get('/reports', { params: query })
    return res.data.data
  }
  const { period } = query
  const range = query.from && query.to ? { from: query.from, to: query.to } : defaultRange(period)
  const start = parseISO(range.from)
  const end = parseISO(range.to)
  if (end < start || differenceInCalendarDays(end, start) > 366) {
    throw new Error('Choose a range of up to one year')
  }
  const inRange = (iso: string) => iso.slice(0, 10) >= range.from && iso.slice(0, 10) <= range.to

  const buckets: string[] = []
  const step = period === 'monthly' ? addMonths : period === 'weekly' ? addWeeks : addDays
  const first =
    period === 'monthly'
      ? startOfMonth(start)
      : period === 'weekly'
        ? startOfWeek(start, { weekStartsOn: 1 })
        : start
  for (let d = first; d <= end; d = step(d, 1)) buckets.push(bucketOf(period, d))
  const paid = samplePayments.filter(
    (p) => p.status === 'paid' && p.order_id !== null && p.paid_at && inRange(p.paid_at),
  )
  const sales_over_time = buckets.map((start) => ({
    start,
    total: paid
      .filter((p) => bucketOf(period, parseISO(p.paid_at ?? '')) === start)
      .reduce((n, p) => n + p.amount, 0),
  }))

  const orders = sampleOrders.filter((o) => inRange(o.created_at))
  const paidOrders = new Set(
    orders.filter((o) => o.payment_status === 'paid').map((o) => o.order_id),
  )
  const sold = new Map<number, number>()
  for (const i of sampleOrderItems.filter((i) => paidOrders.has(i.order_id))) {
    sold.set(i.item_id, (sold.get(i.item_id) ?? 0) + i.quantity)
  }
  const best_sellers = [...sold]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([item_id, quantity]) => ({
      item_id,
      name: sampleMenuItems.find((m) => m.item_id === item_id)?.name ?? '',
      quantity,
    }))

  const bookings = sampleReservations.filter(
    (r) =>
      r.status !== 'cancelled' &&
      r.reservation_date >= range.from &&
      r.reservation_date <= range.to,
  )
  const reservations_per_day = Array.from(
    { length: differenceInCalendarDays(end, start) + 1 },
    (_, i) => {
      const date = day(addDays(start, i))
      return { date, count: bookings.filter((r) => r.reservation_date === date).length }
    },
  )

  const total_sales = paid.reduce((n, p) => n + p.amount, 0)
  const no_shows = bookings.filter((r) => r.status === 'no_show').length
  const arrived = bookings.filter((r) => r.status === 'arrived').length
  const hours = new Map<string, number>()
  for (const o of orders) {
    const hour = `${o.created_at.slice(11, 13)}:00:00`
    hours.set(hour, (hours.get(hour) ?? 0) + 1)
  }
  const busiest = [...hours].sort((a, b) => b[1] - a[1])[0]

  return {
    period,
    ...range,
    sales_over_time,
    best_sellers,
    reservations_per_day,
    summary: {
      total_sales,
      total_orders: orders.length,
      average_order_value: paidOrders.size
        ? Math.round((total_sales / paidOrders.size) * 100) / 100
        : 0,
      reservations: bookings.length,
      no_shows,
      no_show_rate: no_shows + arrived ? Math.round((no_shows / (no_shows + arrived)) * 100) : 0,
      busiest_hour: busiest ? busiest[0] : null,
    },
  }
}
