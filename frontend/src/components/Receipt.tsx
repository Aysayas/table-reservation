import { format, parseISO } from 'date-fns'
import type { StaffOrder } from '@/services/orders'
import type { RestaurantSettings } from '@/types/db'

type Props = {
  order: StaffOrder
  settings: RestaurantSettings | undefined
  cashReceived: number | null
  servedBy: string
  printedAt: Date
}

const money = (amount: number) =>
  amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const rule = 'my-3 border-t border-dashed border-black'

function Row({ left, right, className = '' }: { left: string; right: string; className?: string }) {
  return (
    <p className={`flex justify-between gap-3 ${className}`}>
      <span>{left}</span>
      <span className="shrink-0 text-right">{right}</span>
    </p>
  )
}

export default function Receipt({ order, settings, cashReceived, servedBy, printedAt }: Props) {
  const placed = parseISO(order.created_at)
  const paid = order.payment_status === 'paid'
  const tendered = paid ? (cashReceived ?? order.total_amount) : 0
  const parts = (settings?.address ?? '').split(', ')

  return (
    <div className="mx-auto w-[72mm] font-mono text-xs leading-relaxed text-black">
      <style>{'@page { size: 80mm 297mm; margin: 4mm; }'}</style>
      <div className="text-center">
        <p className="text-base font-bold tracking-[0.15em] uppercase">
          {settings?.restaurant_name}
        </p>
        <p>{parts.slice(0, 2).join(', ')}</p>
        <p>{parts.slice(2).join(', ')}</p>
        <p>Tel. {settings?.contact_number}</p>
      </div>

      <div className={rule} />
      <Row
        left={`ORDER #${order.order_id}`}
        right={`TABLE ${order.table_number}`}
        className="font-bold"
      />
      <Row left={`Date: ${format(placed, 'MM/dd/yy')}`} right={format(placed, 'h:mm a')} />
      <Row left="Type: Dine-in" right="QR order" />

      <div className={rule} />
      <Row left="QTY ITEM" right="AMOUNT" className="font-bold" />
      <div className="my-1 border-t border-dotted border-black" />
      {order.items.map((item) => (
        <div key={item.order_item_id}>
          <Row
            left={`${item.quantity} x ${item.name.toUpperCase()}`}
            right={money(item.unit_price * item.quantity)}
          />
          {item.notes && <p className="pl-4">* {item.notes}</p>}
        </div>
      ))}

      <div className={rule} />
      <p>Items: {order.items.reduce((n, i) => n + i.quantity, 0)}</p>
      <Row left="SUBTOTAL" right={money(order.subtotal)} />
      <Row left="SERVICE CHARGE" right={money(order.service_charge)} />
      <div className="my-2 border-t border-black" />
      <Row left="TOTAL" right={`₱ ${money(order.total_amount)}`} className="text-sm font-bold" />
      <div className="my-2 border-t border-black" />

      <Row
        left={`PAYMENT: ${paid ? (order.payment_method ?? 'cash').toUpperCase() : 'UNPAID'}`}
        right={money(tendered)}
      />
      <Row
        left="STATUS"
        right={paid ? 'PAID' : 'UNPAID'}
        className="[&>span:last-child]:font-bold"
      />
      <Row left="CHANGE" right={money(paid ? tendered - order.total_amount : 0)} />

      <div className={rule} />
      <div className="text-center">
        <p className="font-bold">*** SALAMAT PO! ***</p>
        <p>Balik po kayo!</p>
        {settings?.facebook_url && (
          <p>{settings.facebook_url.replace(/^https?:\/\/(www\.)?/, '')}</p>
        )}
      </div>
      <div className={rule} />
      <div className="text-center text-xs">
        <p>Printed {format(printedAt, 'MM/dd/yy h:mm a')}</p>
        <p>Served by: {servedBy}</p>
      </div>
    </div>
  )
}
