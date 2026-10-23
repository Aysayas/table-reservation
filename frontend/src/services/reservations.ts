import {
  sampleCustomers,
  samplePayments,
  sampleReservations,
  sampleTables,
} from '@/services/sampleData'
import type { PublicReservation } from '@/types/db'

export async function getReservationByCode(code: string): Promise<PublicReservation | undefined> {
  const reservation = sampleReservations.find((r) => r.reference_code === code)
  if (!reservation) return undefined
  const customer = sampleCustomers.find((c) => c.customer_id === reservation.customer_id)
  const table = sampleTables.find((t) => t.table_id === reservation.table_id)
  const paid = samplePayments.some(
    (p) => p.reservation_id === reservation.reservation_id && p.status === 'paid',
  )
  return {
    ...reservation,
    customer: {
      full_name: customer?.full_name ?? '',
      mobile_number: `09XX XXX ${customer?.mobile_number.slice(-4) ?? 'XXXX'}`,
    },
    table_number: table?.table_number ?? null,
    deposit_status: paid ? 'paid' : 'unpaid',
  }
}
