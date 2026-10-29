import { api, USE_SAMPLE } from '@/lib/api'
import { samplePayments, sampleReservations, sampleUsers } from '@/services/sampleData'
import type { Payment, PaymentMethod, PaymentStatus } from '@/types/db'

export type AdminPayment = Omit<Payment, 'received_by'> & {
  for:
    | { type: 'order'; order_id: number }
    | { type: 'deposit'; reservation_id: number; reference_code: string }
  received_by: { user_id: number; full_name: string } | null
}

export type PaymentFilter = {
  method?: PaymentMethod
  status?: PaymentStatus
  date_from?: string
  date_to?: string
  search?: string
  page: number
}

const toAdmin = (p: Payment): AdminPayment => {
  const user = sampleUsers.find((u) => u.user_id === p.received_by)
  return {
    ...p,
    for: p.order_id
      ? { type: 'order', order_id: p.order_id }
      : {
          type: 'deposit',
          reservation_id: p.reservation_id ?? 0,
          reference_code:
            sampleReservations.find((r) => r.reservation_id === p.reservation_id)?.reference_code ??
            '',
        },
    received_by: user ? { user_id: user.user_id, full_name: user.full_name } : null,
  }
}

const matches = (p: AdminPayment, term: string) => {
  const id = String(Number(term.replace(/^pay-/, '').replace(/^#/, '')))
  const byPayment = !term.startsWith('#')
  const byOrder = !term.startsWith('pay-')
  return (
    (byPayment && String(p.payment_id) === id) ||
    (byOrder && p.for.type === 'order' && String(p.for.order_id) === id) ||
    (p.for.type === 'deposit' && p.for.reference_code.toLowerCase() === term) ||
    (p.provider_reference ?? '').toLowerCase() === term
  )
}

const perPage = 8

export type PaymentPage = {
  data: AdminPayment[]
  totals: { total_collected: number; online: number; cash: number; deposits: number }
  meta: { total: number; page: number; per_page: number }
}

export async function listPayments(filter: PaymentFilter): Promise<PaymentPage> {
  if (!USE_SAMPLE) {
    const res = await api.get('/payments', {
      params: { ...filter, search: filter.search?.trim() || undefined },
    })
    return res.data
  }
  const term = (filter.search ?? '').trim().toLowerCase()
  const dated = !!(filter.date_from || filter.date_to)
  const inRange = (p: Payment) => {
    if (!dated) return true
    if (!p.paid_at) return false
    const day = p.paid_at.slice(0, 10)
    return (
      (!filter.date_from || day >= filter.date_from) && (!filter.date_to || day <= filter.date_to)
    )
  }
  const data = samplePayments
    .filter(inRange)
    .map(toAdmin)
    .filter((p) => !filter.method || p.method === filter.method)
    .filter((p) => !filter.status || p.status === filter.status)
    .filter((p) => !term || matches(p, term))
    .sort((a, b) => (b.paid_at ?? '9999').localeCompare(a.paid_at ?? '9999'))
  const paid = samplePayments.filter((p) => p.status === 'paid' && inRange(p))
  const sum = (list: Payment[]) => list.reduce((n, p) => n + p.amount, 0)
  const start = (filter.page - 1) * perPage
  return {
    data: data.slice(start, start + perPage),
    meta: { total: data.length, page: filter.page, per_page: perPage },
    totals: {
      total_collected: sum(paid),
      online: sum(paid.filter((p) => p.method === 'online')),
      cash: sum(paid.filter((p) => p.method === 'cash')),
      deposits: sum(paid.filter((p) => p.reservation_id !== null)),
    },
  }
}
