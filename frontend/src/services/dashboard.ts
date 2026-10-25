import {
  sampleCustomers,
  sampleOrderItems,
  sampleOrders,
  sampleReservations,
  sampleTables,
} from '@/services/sampleData'
import type { OrderStatus, ReservationStatus } from '@/types/db'

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
