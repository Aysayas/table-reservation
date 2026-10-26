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

export type AdminTable = StaffTable & { qr_token: string }

export async function getAdminTables(): Promise<AdminTable[]> {
  const tables = await getTables()
  return tables.map((t) => ({
    ...t,
    qr_token: sampleTables.find((s) => s.table_id === t.table_id)?.qr_token ?? '',
  }))
}

export type TableInput = { table_number: string; capacity: number }

const findTable = (table_id: number) => {
  const table = sampleTables.find((t) => t.table_id === table_id)
  if (!table) throw new Error('Table not found')
  return table
}

const checkNumber = (table_number: string, except?: number) => {
  const name = table_number.trim().toLowerCase()
  if (sampleTables.some((t) => t.table_id !== except && t.table_number.toLowerCase() === name)) {
    throw new Error('A table with that number already exists')
  }
}

const upcoming = (table_id: number) => {
  const today = new Date().toLocaleDateString('en-CA')
  return sampleReservations.filter(
    (r) =>
      r.table_id === table_id &&
      r.reservation_date >= today &&
      (r.status === 'pending' || r.status === 'confirmed'),
  )
}

export async function createTable(body: TableInput): Promise<RestaurantTable> {
  checkNumber(body.table_number)
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  const table: RestaurantTable = {
    table_id: Math.max(0, ...sampleTables.map((t) => t.table_id)) + 1,
    table_number: body.table_number.trim(),
    capacity: body.capacity,
    qr_token: Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join(''),
    status: 'available',
  }
  sampleTables.push(table)
  return { ...table }
}

export async function updateTable(table_id: number, body: TableInput): Promise<RestaurantTable> {
  const table = findTable(table_id)
  checkNumber(body.table_number, table_id)
  if (upcoming(table_id).some((r) => r.pax > body.capacity)) {
    throw new Error('A booking from today on has more guests than this table seats')
  }
  table.table_number = body.table_number.trim()
  table.capacity = body.capacity
  return { ...table }
}

export async function deleteTable(table_id: number): Promise<void> {
  findTable(table_id)
  if (sampleOrders.some((o) => o.table_id === table_id) || upcoming(table_id).length) {
    throw new Error("This table has orders or upcoming bookings. It can't be deleted.")
  }
  sampleTables.splice(
    sampleTables.findIndex((t) => t.table_id === table_id),
    1,
  )
}
