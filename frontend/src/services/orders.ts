import { format } from 'date-fns'
import {
  sampleMenuItems,
  sampleOrderItems,
  sampleOrders,
  sampleSettings,
  sampleTables,
} from '@/services/sampleData'
import type { Order, OrderItem } from '@/types/db'

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
}

const toCents = (amount: number) => Math.round(amount * 100) / 100

export async function createOrder(body: NewOrder): Promise<PublicOrder> {
  const table = sampleTables.find((t) => t.table_id === body.table_id)
  if (!table || table.qr_token !== body.qr_token) {
    throw new Error('Please scan the QR code on your table again.')
  }
  if (body.items.length < 1 || body.items.length > 50) {
    throw new Error('An order needs 1 to 50 dishes.')
  }
  const lines = body.items.map((line) => {
    const item = sampleMenuItems.find((m) => m.item_id === line.item_id)
    if (!item || !item.is_available) throw new Error('A dish in your cart is no longer available.')
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
  const items = lines.map(({ line, item }) => {
    const orderItem: OrderItem = {
      order_item_id: ++nextItemId,
      order_id,
      item_id: item.item_id,
      quantity: line.quantity,
      unit_price: item.price,
      notes: line.notes,
    }
    sampleOrderItems.push(orderItem)
    return { ...orderItem, name: item.name }
  })
  return { ...order, table_number: table.table_number, subtotal, service_charge, items }
}

export async function payOrder(order_id: number, qr_token: string): Promise<void> {
  const order = sampleOrders.find((o) => o.order_id === order_id)
  const table = sampleTables.find((t) => t.table_id === order?.table_id)
  if (!order || table?.qr_token !== qr_token) throw new Error('Order not found')
  if (order.payment_status === 'paid') throw new Error('This order is already paid')
  order.payment_status = 'paid'
}
