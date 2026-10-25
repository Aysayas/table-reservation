import { format } from 'date-fns'
import {
  sampleCustomers,
  sampleOpeningHours,
  samplePayments,
  sampleReservations,
  sampleSettings,
  sampleTables,
} from '@/services/sampleData'
import type { PublicReservation, Reservation, ReservationStatus } from '@/types/db'

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

export type ReservationView = 'today' | 'upcoming' | 'past' | 'cancelled'

export type ReservationFilter = {
  view: ReservationView
  status: ReservationStatus | ''
  search: string
  page: number
}

const perPage = 8

const toStaff = (r: Reservation): PublicReservation => {
  const customer = sampleCustomers.find((c) => c.customer_id === r.customer_id)
  return {
    ...r,
    customer: {
      full_name: customer?.full_name ?? '',
      mobile_number: customer?.mobile_number ?? '',
    },
    table_number: sampleTables.find((t) => t.table_id === r.table_id)?.table_number ?? null,
    deposit_status: samplePayments.some(
      (p) => p.reservation_id === r.reservation_id && p.status === 'paid',
    )
      ? 'paid'
      : 'unpaid',
  }
}

export async function listReservations(filter: ReservationFilter) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const term = filter.search.trim().toLowerCase()
  const when = (r: Reservation) => `${r.reservation_date} ${r.reservation_time}`
  const active = (r: Reservation) => r.status === 'pending' || r.status === 'confirmed'
  const inView: Record<ReservationView, (r: Reservation) => boolean> = {
    today: (r) => r.reservation_date === today,
    upcoming: (r) => r.reservation_date > today && active(r),
    past: (r) => r.reservation_date < today && r.status !== 'cancelled',
    cancelled: (r) => r.status === 'cancelled',
  }
  const matches = sampleReservations
    .filter((r) => {
      const name = sampleCustomers.find((c) => c.customer_id === r.customer_id)?.full_name ?? ''
      return term
        ? r.reference_code.toLowerCase().includes(term) || name.toLowerCase().includes(term)
        : inView[filter.view](r)
    })
    .filter((r) => !filter.status || r.status === filter.status)
    .sort((a, b) =>
      filter.view === 'past' || filter.view === 'cancelled'
        ? when(b).localeCompare(when(a))
        : when(a).localeCompare(when(b)),
    )
  const start = (filter.page - 1) * perPage
  return {
    data: matches.slice(start, start + perPage).map(toStaff),
    meta: { total: matches.length, page: filter.page, per_page: perPage },
  }
}

const moves: Partial<Record<ReservationStatus, ReservationStatus[]>> = {
  pending: ['confirmed', 'no_show', 'cancelled'],
  confirmed: ['arrived', 'no_show', 'cancelled'],
}

export async function updateReservationStatus(
  reservation_id: number,
  change: { status?: ReservationStatus; table_id?: number },
): Promise<PublicReservation> {
  const r = sampleReservations.find((x) => x.reservation_id === reservation_id)
  if (!r) throw new Error('Reservation not found')
  if (!moves[r.status]) throw new Error('This reservation can no longer be changed')

  if (change.table_id !== undefined) {
    const table = sampleTables.find((t) => t.table_id === change.table_id)
    if (!table || table.capacity < r.pax)
      throw new Error('That table is too small for this booking')
    const taken = sampleReservations.some(
      (x) =>
        x.reservation_id !== r.reservation_id &&
        x.table_id === table.table_id &&
        x.reservation_date === r.reservation_date &&
        x.reservation_time === r.reservation_time &&
        (x.status === 'pending' || x.status === 'confirmed' || x.status === 'arrived'),
    )
    if (taken) throw new Error('That table is already booked at this time')
    r.table_id = table.table_id
    if (table.status === 'available') table.status = 'reserved'
    if (r.status === 'pending' && !change.status) r.status = 'confirmed'
  }

  if (change.status) {
    if (!moves[r.status]?.includes(change.status)) throw new Error("That change isn't allowed")
    if (change.status === 'arrived' && r.table_id === null) {
      throw new Error('Assign a table before marking the guests as arrived')
    }
    r.status = change.status
    const table = sampleTables.find((t) => t.table_id === r.table_id)
    if (table && change.status === 'arrived') table.status = 'occupied'
    if (
      table &&
      (change.status === 'no_show' || change.status === 'cancelled') &&
      table.status === 'reserved'
    ) {
      table.status = 'available'
    }
  }
  return toStaff(r)
}
