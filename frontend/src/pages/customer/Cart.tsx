import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Minus, Plus, UtensilsCrossed } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { getMenuItems, getRecommendations } from '@/services/menu'
import { getSettings } from '@/services/settings'
import { cartTotal, useCart } from '@/stores/cart'
import type { MenuItem } from '@/types/db'

const peso = (amount: number) =>
  `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function Photo({ item, name, className }: { item?: MenuItem; name: string; className: string }) {
  return item?.image_url ? (
    <img src={item.image_url} alt={`${name} photo`} className={`${className} object-cover`} />
  ) : (
    <div
      role="img"
      aria-label={`${name} photo`}
      className={`${className} bg-brand-charcoal text-brand-gold/60 flex items-center justify-center`}
    >
      <UtensilsCrossed className="size-5" strokeWidth={1.25} />
    </div>
  )
}

export default function Cart() {
  const navigate = useNavigate()
  const { tableId = '' } = useParams()
  const table = Number(tableId)
  const cartTable = useCart((s) => s.tableId)
  const allLines = useCart((s) => s.lines)
  const { add, setQuantity, remove } = useCart.getState()
  const lines = cartTable === table ? allLines : []
  const { data: items = [] } = useQuery({ queryKey: ['menu-items'], queryFn: () => getMenuItems() })
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: getSettings })
  const menuLink = `/table/${table}/menu`

  const subtotal = cartTotal(lines)
  const serviceCharge = Math.round(subtotal * (settings?.service_charge_percent ?? 0)) / 100
  const cartIds = lines.map((l) => l.item_id)
  const { data: suggestions = [] } = useQuery({
    queryKey: ['recommendations', cartIds],
    queryFn: () => getRecommendations(cartIds, 2),
  })
  const itemFor = (id: number) => items.find((i) => i.item_id === id)
  const hasUnavailable = lines.some((l) => itemFor(l.item_id)?.is_available === false)

  return (
    <div
      className={`bg-brand-cream min-h-[calc(100dvh-4rem)] px-4 pt-5 ${lines.length ? 'short:pb-6 pb-28' : 'pb-10'}`}
    >
      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label="Back"
          onClick={() => navigate(-1)}
          className="border-brand-line text-brand-charcoal hover:border-brand-gold flex size-10 shrink-0 items-center justify-center rounded-full border bg-white transition-colors duration-200"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-brand-charcoal font-serif text-3xl">Your Cart</h1>
      </div>

      {lines.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-brand-charcoal font-serif text-2xl">Your cart is empty</p>
          <p className="text-brand-ink/70 mt-2 text-sm">Add a few dishes from the menu first.</p>
          <Link
            to={menuLink}
            className="bg-brand-red hover:bg-brand-red/90 mt-6 inline-block rounded-lg px-8 py-3 text-sm font-bold tracking-[0.1em] text-white uppercase transition-colors duration-200"
          >
            Browse the menu
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-6">
            {lines.map((line) => (
              <li
                key={`${line.item_id}-${line.notes}`}
                className="border-brand-line flex gap-3 border-b py-4"
              >
                <Photo
                  item={itemFor(line.item_id)}
                  name={line.name}
                  className="size-16 shrink-0 rounded-md"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-brand-charcoal text-sm font-semibold">{line.name}</p>
                    <p className="text-brand-charcoal shrink-0 font-serif text-base">
                      {peso(line.price * line.quantity)}
                    </p>
                  </div>
                  {line.notes && (
                    <p className="text-brand-ink/70 mt-0.5 text-xs">Note: {line.notes}</p>
                  )}
                  {itemFor(line.item_id)?.is_available === false && (
                    <p className="text-brand-red mt-0.5 text-xs font-semibold">
                      Not available right now. Please remove it.
                    </p>
                  )}
                  <div className="mt-2 flex items-center justify-between">
                    <div
                      role="group"
                      aria-label={`${line.name} quantity`}
                      className="border-brand-line inline-flex items-center rounded-md border bg-white"
                    >
                      <button
                        type="button"
                        aria-label={`Less ${line.name}`}
                        disabled={line.quantity <= 1}
                        onClick={() => setQuantity(line, line.quantity - 1)}
                        className="text-brand-charcoal flex size-8 items-center justify-center disabled:opacity-40"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <output className="border-brand-line text-brand-charcoal w-8 border-x py-1 text-center text-sm font-semibold">
                        {line.quantity}
                      </output>
                      <button
                        type="button"
                        aria-label={`More ${line.name}`}
                        disabled={line.quantity >= 99}
                        onClick={() => setQuantity(line, line.quantity + 1)}
                        className="text-brand-charcoal flex size-8 items-center justify-center disabled:opacity-40"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      aria-label={`Remove ${line.name}`}
                      onClick={() => {
                        remove(line)
                        toast(`${line.name} removed`, {
                          action: { label: 'Undo', onClick: () => add(table, line) },
                        })
                      }}
                      className="text-brand-ink/70 hover:text-brand-red text-xs font-semibold underline-offset-2 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {suggestions.length > 0 && (
            <section aria-labelledby="also-like" className="mt-6">
              <h2 id="also-like" className="text-brand-charcoal font-serif text-xl">
                You Might Also Like
              </h2>
              <ul className="mt-3 grid grid-cols-2 gap-3">
                {suggestions.map((dish) => (
                  <li
                    key={dish.item_id}
                    className="border-brand-line flex gap-2 rounded-lg border bg-white p-2"
                  >
                    <Photo item={dish} name={dish.name} className="size-14 shrink-0 rounded-md" />
                    <div className="min-w-0">
                      <p className="text-brand-charcoal line-clamp-2 text-xs font-semibold">
                        {dish.name}
                      </p>
                      <p className="text-brand-red font-serif text-sm">{peso(dish.price)}</p>
                      <button
                        type="button"
                        aria-label={`Add ${dish.name}`}
                        onClick={() => {
                          add(table, {
                            item_id: dish.item_id,
                            name: dish.name,
                            price: dish.price,
                            quantity: 1,
                            notes: '',
                          })
                          toast.success(`${dish.name} added to cart`)
                        }}
                        className="text-brand-charcoal hover:text-brand-red text-xs font-bold"
                      >
                        + Add
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <dl className="mt-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-brand-ink/70">Subtotal</dt>
              <dd className="text-brand-charcoal">{peso(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-brand-ink/70">
                Service Charge ({settings?.service_charge_percent ?? 0}%)
              </dt>
              <dd className="text-brand-charcoal">{peso(serviceCharge)}</dd>
            </div>
            <div className="border-brand-line flex justify-between border-t pt-3">
              <dt className="text-brand-charcoal font-serif text-xl">Total</dt>
              <dd className="text-brand-red font-serif text-xl">
                {peso(subtotal + serviceCharge)}
              </dd>
            </div>
          </dl>

          <div className="short:static short:mt-4 short:pb-0 short:px-0 fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[390px] px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {hasUnavailable ? (
              <button
                type="button"
                disabled
                className="bg-brand-red block w-full rounded-lg py-4 text-center text-sm font-bold tracking-[0.1em] text-white uppercase opacity-60 shadow-lg"
              >
                Proceed to Checkout
              </button>
            ) : (
              <Link
                to={`/table/${table}/checkout`}
                className="bg-brand-red hover:bg-brand-red/90 block w-full rounded-lg py-4 text-center text-sm font-bold tracking-[0.1em] text-white uppercase shadow-lg transition-colors duration-200"
              >
                Proceed to Checkout
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  )
}
