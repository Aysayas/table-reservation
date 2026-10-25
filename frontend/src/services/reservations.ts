import { format } from 'date-fns'
import {
  sampleCustomers,
  sampleOpeningHours,
  samplePayments,
  sampleReservations,
  sampleSettings,
  sampleTables,
} from '@/services/sampleData'
import type { PublicReservation, Reservation } from '@/types/db'

export type TimeSlot = { time: string; available: boolean }

export type NewReservation = {
  full_name: string
  mobile_number: string
  email: string | null
  reservation_date: string
  reservation_time: string
  pax: number
  special_request: string | null
}

const toMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

const toTime = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}:00`

export async function getAvailability(date: string, pax: number): Promise<TimeSlot[]> {
  const day = sampleOpeningHours.find((h) => h.day_of_week === new Date(`${date}T00:00`).getDay())
  if (!day?.is_open || !day.open_time || !day.close_time) return []
  const now = new Date()
  const isToday = date === format(now, 'yyyy-MM-dd')
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const tables = sampleTables.filter((t) => t.capacity >= pax).length
  const slots: TimeSlot[] = []
  for (
    let m = toMinutes(day.open_time);
    m + sampleSettings.slot_minutes <= toMinutes(day.close_time);
    m += sampleSettings.slot_minutes
  ) {
    if (isToday && m <= nowMinutes) continue
    const time = toTime(m)
    const booked = sampleReservations.filter(
      (r) =>
        r.reservation_date === date &&
        r.reservation_time === time &&
        (r.status === 'pending' || r.status === 'confirmed'),
    ).length
    slots.push({ time, available: booked < tables })
  }
  return slots
}

export async function createReservation(body: NewReservation): Promise<Reservation> {
  const customer_id = Math.max(0, ...sampleCustomers.map((c) => c.customer_id)) + 1
  const created_at = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss")
  sampleCustomers.push({
    customer_id,
    full_name: body.full_name,
    mobile_number: body.mobile_number,
    email: body.email,
    created_at,
  })
  const reservation: Reservation = {
    reservation_id: Math.max(0, ...sampleReservations.map((r) => r.reservation_id)) + 1,
    customer_id,
    table_id: null,
    reference_code: `RSV-${Math.random().toString(36).slice(2, 8).toUpperCase().padEnd(6, '0')}`,
    reservation_date: body.reservation_date,
    reservation_time: body.reservation_time,
    pax: body.pax,
    special_request: body.special_request,
    deposit_amount: sampleSettings.deposit_required
      ? body.pax * sampleSettings.deposit_per_guest
      : 0,
    status: 'pending',
    reminder_sent_at: null,
    created_at,
  }
  sampleReservations.push(reservation)
  return reservation
}

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
