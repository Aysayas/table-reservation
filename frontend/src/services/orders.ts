import axios from 'axios'
import { format } from 'date-fns'
import { api, USE_SAMPLE } from '@/lib/api'
import {
  sampleMenuItems,
  sampleOrderItems,
  sampleOrders,
  samplePayments,
  sampleSettings,
  sampleTables,
} from '@/services/sampleData'
import type { Order, OrderItem, OrderStatus, Payment } from '@/types/db'

export type NewOrder = {
  table_id: number
  qr_token: string
  customer_name: string | null
  items: { item_id: number; quantity: number; notes: string | null }[]
}

export type PublicOrder = Order & {
  table_number: string
  subtotal: number
  service_charge: number
  items: (OrderItem & { name: string })[]
  channel: string | null
}

const toCents = (amount: number) => Math.round(amount * 100) / 100

export async function createOrder(body: NewOrder): Promise<PublicOrder> {
  if (USE_SAMPLE) {
    const table = sampleTables.find((t) => t.table_id === body.table_id)
    if (!table || table.qr_token !== body.qr_token) {
      throw new Error('Please scan the QR code on your table again.')
    }
    if (body.items.length < 1 || body.items.length > 50) {
      throw new Error('An order needs 1 to 50 dishes.')
    }
    const lines = body.items.map((line) => {
      const item = sampleMenuItems.find((m) => m.item_id === line.item_id)
      if (!item || !item.is_available)
        throw new Error('A dish in your cart is no longer available.')
      return { line, item }
    })
    const order_id = Math.max(0, ...sampleOrders.map((o) => o.order_id)) + 1
    const subtotal = toCents(
      lines.reduce((sum, { line, item }) => sum + item.price * line.quantity, 0),
    )
    const service_charge = toCents((subtotal * sampleSettings.service_charge_percent) / 100)
    const order: Order = {
      order_id,
      table_id: table.table_id,
      customer_id: null,
      customer_name: body.customer_name,
      status: 'received',
      total_amount: toCents(subtotal + service_charge),
      payment_status: 'unpaid',
      created_at: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
    }
    sampleOrders.push(order)
    let nextItemId = Math.max(0, ...sampleOrderItems.map((i) => i.order_item_id))
    for (const { line, item } of lines) {
      sampleOrderItems.push({
        order_item_id: ++nextItemId,
        order_id,
        item_id: item.item_id,
        quantity: line.quantity,
        unit_price: item.price,
        notes: line.notes,
      })
    }
    return toPublic(order)
  }
  const res = await api.post('/orders', body)
  return res.data.data
}

const toPublic = (order: Order): PublicOrder => {
  const items = sampleOrderItems
    .filter((i) => i.order_id === order.order_id)
    .map((i) => ({ ...i, name: sampleMenuItems.find((m) => m.item_id === i.item_id)?.name ?? '' }))
  const subtotal = toCents(items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0))
  return {
    ...order,
    table_number: sampleTables.find((t) => t.table_id === order.table_id)?.table_number ?? '',
    subtotal,
    service_charge: toCents(order.total_amount - subtotal),
    items,
    channel: null,
  }
}

export async function getOrder(order_id: number, qr_token: string): Promise<PublicOrder | null> {
  if (USE_SAMPLE) {
    const order = sampleOrders.find((o) => o.order_id === order_id)
    const table = sampleTables.find((t) => t.table_id === order?.table_id)
    return order && table?.qr_token === qr_token ? toPublic(order) : null
  }
  try {
    const res = await api.get(`/orders/${order_id}`, { params: { qr_token } })
    return res.data.data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null
    throw error
  }
}

export async function payOrder(
  order_id: number,
  qr_token: string,
): Promise<{ checkout_url: string } | null> {
  if (USE_SAMPLE) {
    const order = sampleOrders.find((o) => o.order_id === order_id)
    const table = sampleTables.find((t) => t.table_id === order?.table_id)
    if (!order || table?.qr_token !== qr_token) throw new Error('Order not found')
    if (order.payment_status === 'paid') throw new Error('This order is already paid')
    order.payment_status = 'paid'
    return null
  }
  const res = await api.post(`/orders/${order_id}/pay`, { qr_token })
  return { checkout_url: res.data.data.checkout_url }
}

export type StaffOrder = PublicOrder & { payment_method: 'cash' | 'online' | null }

export async function listOrders(
  filter: {
    payment_status?: 'paid' | 'unpaid'
    status?: OrderStatus[]
    search?: string
    date_from?: string
    date_to?: string
  } = {},
): Promise<StaffOrder[]> {
  if (USE_SAMPLE) {
    const term = (filter.search ?? '').trim().replace(/^#/, '').toLowerCase()
    const tableOf = (o: Order) =>
      sampleTables.find((t) => t.table_id === o.table_id)?.table_number.toLowerCase() ?? ''
    return sampleOrders
      .filter((o) => !filter.payment_status || o.payment_status === filter.payment_status)
      .filter((o) => !filter.status || filter.status.includes(o.status))
      .filter((o) => !term || String(o.order_id) === term || tableOf(o) === term)
      .filter((o) => !filter.date_from || o.created_at.slice(0, 10) >= filter.date_from)
      .filter((o) => !filter.date_to || o.created_at.slice(0, 10) <= filter.date_to)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((o) => ({
        ...toPublic(o),
        payment_method:
          o.payment_status === 'paid'
            ? (samplePayments.find((p) => p.order_id === o.order_id && p.status === 'paid')
                ?.method ?? 'online')
            : null,
      }))
  }
  const res = await api.get('/orders', {
    params: { ...filter, status: filter.status?.join(',') || undefined },
  })
  return res.data.data
}

export async function recordPayment(body: {
  order_id: number
  amount: number
}): Promise<Omit<Payment, 'order_id' | 'received_by'> & { order_id: number }> {
  if (USE_SAMPLE) {
    const order = sampleOrders.find((o) => o.order_id === body.order_id)
    if (!order) throw new Error('Order not found')
    if (order.payment_status === 'paid') throw new Error('This order is already paid')
    if (toCents(body.amount) !== order.total_amount) {
      throw new Error("The amount doesn't match the order total")
    }
    const payment = {
      payment_id: Math.max(0, ...samplePayments.map((p) => p.payment_id)) + 1,
      order_id: order.order_id,
      reservation_id: null,
      received_by: 2,
      method: 'cash' as const,
      provider_reference: null,
      amount: order.total_amount,
      status: 'paid' as const,
      paid_at: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
    }
    samplePayments.push(payment)
    order.payment_status = 'paid'
    return payment
  }
  const res = await api.post('/payments', body)
  return res.data.data
}

const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  received: 'preparing',
  preparing: 'ready',
  ready: 'served',
}

export async function updateOrderStatus(
  order_id: number,
  status: OrderStatus,
): Promise<PublicOrder> {
  if (USE_SAMPLE) {
    const order = sampleOrders.find((o) => o.order_id === order_id)
    if (!order) throw new Error('Order not found')
    const undoServed = order.status === 'served' && status === 'ready'
    if (nextStatus[order.status] !== status && !undoServed) {
      throw new Error('This order was already updated')
    }
    order.status = status
    return toPublic(order)
  }
  const res = await api.patch(`/orders/${order_id}/status`, { status })
  return res.data.data
}
