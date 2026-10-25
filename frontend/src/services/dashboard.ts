import {
  sampleCustomers,
  sampleMenuItems,
  sampleOrderItems,
  sampleOrders,
  samplePayments,
  sampleReservations,
  sampleTables,
} from '@/services/sampleData'
import type { OrderPaymentStatus, OrderStatus, PaymentMethod, ReservationStatus } from '@/types/db'

export type StaffDashboard = {
  reservations_today: number
  guests_arrived: number
  active_orders: number
  available_tables: number
  total_tables: number
  upcoming_reservations: {
    reservation_id: number
    reference_code: string
    reservation_time: string
    full_name: string
    pax: number
    table_number: string | null
    status: ReservationStatus
  }[]
  active_orders_list: {
    order_id: number
    table_number: string
    item_count: number
    total_amount: number
    status: OrderStatus
  }[]
}

export async function getStaffDashboard(): Promise<StaffDashboard> {
  const now = new Date()
  const today = now.toLocaleDateString('en-CA')
  const time = now.toTimeString().slice(0, 8)
  const tableNumber = (id: number | null) =>
    sampleTables.find((t) => t.table_id === id)?.table_number ?? null
  const todays = sampleReservations.filter(
    (r) => r.reservation_date === today && ['pending', 'confirmed', 'arrived'].includes(r.status),
  )
  const notServed = sampleOrders.filter((o) => o.status !== 'served')

  return {
    reservations_today: todays.length,
    guests_arrived: todays.filter((r) => r.status === 'arrived').reduce((n, r) => n + r.pax, 0),
    active_orders: notServed.length,
    available_tables: sampleTables.filter((t) => t.status === 'available').length,
    total_tables: sampleTables.length,
    upcoming_reservations: todays
      .filter((r) => r.status !== 'arrived' && r.reservation_time >= time)
      .sort((a, b) => a.reservation_time.localeCompare(b.reservation_time))
      .slice(0, 7)
      .map((r) => ({
        reservation_id: r.reservation_id,
        reference_code: r.reference_code,
        reservation_time: r.reservation_time,
        full_name: sampleCustomers.find((c) => c.customer_id === r.customer_id)?.full_name ?? '',
        pax: r.pax,
        table_number: tableNumber(r.table_id),
        status: r.status,
      })),
    active_orders_list: [...notServed]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 7)
      .map((o) => ({
        order_id: o.order_id,
        table_number: tableNumber(o.table_id) ?? '',
        item_count: sampleOrderItems
          .filter((i) => i.order_id === o.order_id)
          .reduce((n, i) => n + i.quantity, 0),
        total_amount: o.total_amount,
        status: o.status,
      })),
  }
}

export type AdminDashboard = {
  sales_today: number
  orders_today: number
  reservations_today: number
  no_show_rate: number
  sales_last_7_days: { date: string; total: number }[]
  best_sellers: { item_id: number; name: string; quantity: number }[]
  recent_orders: {
    order_id: number
    created_at: string
    table_number: string
    item_count: number
    total_amount: number
    payment_status: OrderPaymentStatus
    payment_method: PaymentMethod | null
    status: OrderStatus
  }[]
}

const dayOf = (n: number) => {
  const day = new Date()
  day.setDate(day.getDate() - n)
  return day.toLocaleDateString('en-CA')
}

export async function getAdminDashboard(): Promise<AdminDashboard> {
  const today = dayOf(0)
  const orderPayments = samplePayments.filter((p) => p.order_id !== null && p.status === 'paid')
  const salesOn = (date: string) =>
    orderPayments.filter((p) => p.paid_at?.startsWith(date)).reduce((n, p) => n + p.amount, 0)
  const monthAgo = dayOf(30)
  const recent = sampleReservations.filter(
    (r) => r.reservation_date >= monthAgo && r.reservation_date <= today,
  )
  const noShows = recent.filter((r) => r.status === 'no_show').length
  const arrived = recent.filter((r) => r.status === 'arrived').length
  const paidRecently = new Set(
    sampleOrders
      .filter((o) => o.payment_status === 'paid' && o.created_at.slice(0, 10) >= monthAgo)
      .map((o) => o.order_id),
  )
  const sold = new Map<number, number>()
  for (const i of sampleOrderItems.filter((i) => paidRecently.has(i.order_id))) {
    sold.set(i.item_id, (sold.get(i.item_id) ?? 0) + i.quantity)
  }

  return {
    sales_today: salesOn(today),
    orders_today: sampleOrders.filter((o) => o.created_at.startsWith(today)).length,
    reservations_today: sampleReservations.filter(
      (r) => r.reservation_date === today && ['pending', 'confirmed', 'arrived'].includes(r.status),
    ).length,
    no_show_rate: noShows + arrived ? Math.round((noShows / (noShows + arrived)) * 100) : 0,
    sales_last_7_days: [6, 5, 4, 3, 2, 1, 0].map((n) => ({
      date: dayOf(n),
      total: salesOn(dayOf(n)),
    })),
    best_sellers: [...sold]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([item_id, quantity]) => ({
        item_id,
        name: sampleMenuItems.find((m) => m.item_id === item_id)?.name ?? '',
        quantity,
      })),
    recent_orders: [...sampleOrders]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 5)
      .map((o) => ({
        order_id: o.order_id,
        created_at: o.created_at,
        table_number: sampleTables.find((t) => t.table_id === o.table_id)?.table_number ?? '',
        item_count: sampleOrderItems
          .filter((i) => i.order_id === o.order_id)
          .reduce((n, i) => n + i.quantity, 0),
        total_amount: o.total_amount,
        payment_status: o.payment_status,
        payment_method:
          o.payment_status === 'paid'
            ? (orderPayments.find((p) => p.order_id === o.order_id)?.method ?? null)
            : null,
        status: o.status,
      })),
  }
}
