import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { apiError } from '@/lib/api'
import { readTableToken } from '@/lib/tableToken'
import { getMenuItems } from '@/services/menu'
import { createOrder, payOrder } from '@/services/orders'
import { getSettings } from '@/services/settings'
import { cartTotal, useCart } from '@/stores/cart'

const peso = (amount: number) =>
  `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const methods = [
  { value: 'now', title: 'Pay Now', text: 'GCash, Maya or Card' },
  { value: 'counter', title: 'Pay at the Counter', text: 'Pay with cash after your meal' },
]

export default function Checkout() {
  const navigate = useNavigate()
  const { tableId = '' } = useParams()
  const table = Number(tableId)
  const cartTable = useCart((s) => s.tableId)
  const allLines = useCart((s) => s.lines)
  const clear = useCart((s) => s.clear)
  const lines = cartTable === table ? allLines : []
  const [method, setMethod] = useState('now')
  const [name, setName] = useState('')
  const [placing, setPlacing] = useState(false)
  const [orderId, setOrderId] = useState<number | null>(null)
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: getSettings })
  const { data: items = [] } = useQuery({ queryKey: ['menu-items'], queryFn: () => getMenuItems() })
  const unavailable = lines.filter(
    (l) => items.find((i) => i.item_id === l.item_id)?.is_available === false,
  )
  const token = readTableToken(table)
  const subtotal = cartTotal(lines)
  const total = subtotal + Math.round(subtotal * (settings?.service_charge_percent ?? 0)) / 100

  const placeOrder = async () => {
    if (!token) return
    setPlacing(true)
    try {
      const id =
        orderId ??
        (
          await createOrder({
            table_id: table,
            qr_token: token,
            customer_name: name.trim() || null,
            items: lines.map((l) => ({
              item_id: l.item_id,
              quantity: l.quantity,
              notes: l.notes || null,
            })),
          })
        ).order_id
      setOrderId(id)
      const pay = method === 'now' ? await payOrder(id, token) : null
      clear()
      if (pay) {
        window.location.assign(pay.checkout_url)
        return
      }
      toast.success(method === 'now' ? 'Order placed and paid' : 'Order placed')
      navigate(`/table/${table}/orders?order=${id}`)
    } catch (e) {
      toast.error(apiError(e, "Couldn't place your order. Please try again."))
      setPlacing(false)
    }
  }

  return (
    <div className="bg-brand-cream min-h-[calc(100vh-4rem)] px-4 pt-5 pb-28">
      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label="Back"
          onClick={() => navigate(-1)}
          className="border-brand-line text-brand-charcoal hover:border-brand-gold flex size-10 shrink-0 items-center justify-center rounded-full border bg-white transition-colors duration-200"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-brand-charcoal font-serif text-3xl">Checkout</h1>
      </div>

      {lines.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-brand-charcoal font-serif text-2xl">Your cart is empty</p>
          <Link
            to={`/table/${table}/menu`}
            className="bg-brand-red hover:bg-brand-red/90 mt-6 inline-block rounded-lg px-8 py-3 text-sm font-bold tracking-[0.1em] text-white uppercase transition-colors duration-200"
          >
            Browse the menu
          </Link>
        </div>
      ) : (
        <>
          <section
            aria-labelledby="summary"
            className="border-brand-line mt-6 rounded-lg border bg-white p-5"
          >
            <h2 id="summary" className="text-brand-charcoal font-serif text-xl">
              Order Summary
            </h2>
            <ul className="mt-4 space-y-2 text-sm">
              {lines.map((line) => (
                <li key={`${line.item_id}-${line.notes}`} className="flex justify-between gap-4">
                  <span className="text-brand-charcoal">
                    {line.quantity}x {line.name}
                    {line.notes && (
                      <span className="text-brand-ink/60 block text-xs">Note: {line.notes}</span>
                    )}
                  </span>
                  <span className="text-brand-charcoal shrink-0">
                    {peso(line.price * line.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="border-brand-line mt-4 flex justify-between border-t pt-3">
              <span className="text-brand-charcoal font-serif text-lg">Total</span>
              <span className="text-brand-red font-serif text-lg">{peso(total)}</span>
            </div>
          </section>

          <fieldset className="mt-8">
            <legend className="text-brand-charcoal font-serif text-xl">
              How would you like to pay?
            </legend>
            <div className="mt-3 space-y-3">
              {methods.map((m) => (
                <label
                  key={m.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border bg-white px-4 py-4 transition-colors duration-200 ${method === m.value ? 'border-brand-red ring-brand-red ring-1' : 'border-brand-line'}`}
                >
                  <input
                    type="radio"
                    name="method"
                    value={m.value}
                    checked={method === m.value}
                    onChange={() => setMethod(m.value)}
                    className="accent-brand-red mt-1 size-4"
                  />
                  <span>
                    <span className="text-brand-charcoal block text-sm font-bold">{m.title}</span>
                    <span className="text-brand-ink/70 block text-xs">{m.text}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="text-brand-charcoal mt-8 block text-sm font-bold">
            Name for the Order (optional)
            <input
              value={name}
              maxLength={60}
              onChange={(e) => setName(e.target.value)}
              placeholder="Juan"
              autoComplete="given-name"
              className="border-brand-line focus:border-brand-gold placeholder:text-brand-ink/50 mt-2 block w-full rounded-md border bg-white px-4 py-3 text-sm font-normal outline-none"
            />
          </label>

          {!token && (
            <p role="alert" className="text-brand-red mt-6 text-sm">
              Please scan the QR code on your table again before ordering.
            </p>
          )}

          {unavailable.length > 0 && (
            <p role="alert" className="text-brand-red mt-6 text-sm">
              {unavailable.map((l) => l.name).join(', ')}{' '}
              {unavailable.length === 1 ? "isn't" : "aren't"} available right now. Please remove{' '}
              {unavailable.length === 1 ? 'it' : 'them'} from your{' '}
              <Link to={`/table/${table}/cart`} className="underline">
                cart
              </Link>
              .
            </p>
          )}

          <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[390px] px-4 pb-4">
            <button
              type="button"
              disabled={!token || placing || unavailable.length > 0}
              onClick={placeOrder}
              className="bg-brand-red hover:bg-brand-red/90 block w-full rounded-lg py-4 text-sm font-bold tracking-[0.1em] text-white uppercase shadow-lg transition-colors duration-200 disabled:opacity-60"
            >
              Place Order
            </button>
          </div>
        </>
      )}
    </div>
  )
}
