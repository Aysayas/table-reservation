import {
  sampleCustomers,
  sampleOrders,
  sampleReservations,
  sampleTables,
} from '@/services/sampleData'
import type { Order, RestaurantTable, TableStatus } from '@/types/db'

export type PublicTable = Omit<RestaurantTable, 'qr_token'>

export type StaffTable = PublicTable & {
  current_order: Pick<
    Order,
    'order_id' | 'status' | 'payment_status' | 'total_amount' | 'created_at'
  > | null
  next_reservation: {
    reservation_id: number
    reference_code: string
    full_name: string
    reservation_time: string
    status: 'pending' | 'confirmed'
  } | null
}

export async function getTable(tableId: number): Promise<PublicTable | undefined> {
  const table = sampleTables.find((t) => t.table_id === tableId)
  if (!table) return undefined
  return {
    table_id: table.table_id,
    table_number: table.table_number,
    capacity: table.capacity,
    status: table.status,
  }
}

export async function getTables(status?: TableStatus): Promise<StaffTable[]> {
  const today = new Date().toLocaleDateString('en-CA')
  return sampleTables
    .filter((t) => !status || t.status === status)
    .map(({ table_id, table_number, capacity, status }) => {
      const order = sampleOrders
        .filter(
          (o) => o.table_id === table_id && (o.status !== 'served' || o.payment_status !== 'paid'),
        )
        .sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
      const booking = sampleReservations
        .filter(
          (r) =>
            r.table_id === table_id &&
            r.reservation_date === today &&
            (r.status === 'pending' || r.status === 'confirmed'),
        )
        .sort((a, b) => a.reservation_time.localeCompare(b.reservation_time))[0]
      return {
        table_id,
        table_number,
        capacity,
        status,
        current_order: order
          ? {
              order_id: order.order_id,
              status: order.status,
              payment_status: order.payment_status,
              total_amount: order.total_amount,
              created_at: order.created_at,
            }
          : null,
        next_reservation:
          booking && (booking.status === 'pending' || booking.status === 'confirmed')
            ? {
                reservation_id: booking.reservation_id,
                reference_code: booking.reference_code,
                full_name:
                  sampleCustomers.find((c) => c.customer_id === booking.customer_id)?.full_name ??
                  '',
                reservation_time: booking.reservation_time,
                status: booking.status,
              }
            : null,
      }
    })
}
