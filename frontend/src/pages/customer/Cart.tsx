import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Minus, Plus, ShoppingBag } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import DishPhoto from '@/components/DishPhoto'
import EmptyState from '@/components/EmptyState'
import LeaderRow from '@/components/LeaderRow'
import { getMenuItems, getRecommendations } from '@/services/menu'
import { getSettings } from '@/services/settings'
import { cartTotal, useCart } from '@/stores/cart'
import useCountUp from '@/hooks/useCountUp'

const peso = (amount: number) =>
  `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

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
  const shownSubtotal = useCountUp(subtotal)
  const shownTotal = useCountUp(subtotal + serviceCharge)
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
          className="border-brand-line text-brand-charcoal hover:border-brand-gold flex size-11 shrink-0 items-center justify-center rounded-full border bg-white transition-colors duration-200"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-brand-charcoal font-serif text-3xl">Your Cart</h1>
      </div>

      {lines.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          text="Add a few dishes from the menu first."
          className="mt-10"
          action={
            <Link
              to={menuLink}
              className="bg-brand-red hover:bg-brand-red/90 tracking-label inline-block rounded-lg px-8 py-3 text-sm font-bold text-white uppercase transition-colors duration-200"
            >
              Browse the menu
            </Link>
          }
        />
      ) : (
        <>
          <ul className="mt-6">
            {lines.map((line) => (
              <li
                key={`${line.item_id}-${line.notes}`}
                className="border-brand-line flex gap-3 border-b py-4"
              >
                <DishPhoto
                  name={line.name}
                  src={itemFor(line.item_id)?.image_url}
                  className="size-16 shrink-0 rounded-lg"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-brand-charcoal min-w-0 text-sm font-semibold wrap-break-word">
                      {line.name}
                    </p>
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
                      className="border-brand-line inline-flex items-center rounded-lg border bg-white"
                    >
                      <button
                        type="button"
                        aria-label={`Less ${line.name}`}
                        disabled={line.quantity <= 1}
                        onClick={() => setQuantity(line, line.quantity - 1)}
                        className="text-brand-charcoal flex size-11 items-center justify-center disabled:opacity-40"
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
                        className="text-brand-charcoal flex size-11 items-center justify-center disabled:opacity-40"
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
                      className="text-brand-ink/70 hover:text-brand-red -mr-2 flex min-h-11 items-center px-2 text-xs font-semibold underline-offset-2 hover:underline"
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
                    className="border-brand-line grid grid-cols-[3.5rem_minmax(0,1fr)] gap-2 rounded-lg border bg-white p-2"
                  >
                    <DishPhoto
                      name={dish.name}
                      src={dish.image_url}
                      className="size-14 shrink-0 rounded-lg"
                    />
                    <div className="min-w-0">
                      <p className="text-brand-charcoal line-clamp-2 text-xs font-semibold">
                        {dish.name}
                      </p>
                      <p className="text-brand-red font-serif text-sm">{peso(dish.price)}</p>
                    </div>
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
                      className="border-brand-charcoal text-brand-charcoal hover:bg-brand-charcoal col-span-2 flex min-h-11 w-full items-center justify-center rounded-lg border text-xs font-bold transition-colors duration-200 hover:text-white"
                    >
                      + Add
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <dl className="mt-6 space-y-2 text-sm">
            <LeaderRow term="Subtotal" valueClassName="text-brand-charcoal">
              {peso(shownSubtotal)}
            </LeaderRow>
            <LeaderRow
              term={`Service Charge (${settings?.service_charge_percent ?? 0}%)`}
              valueClassName="text-brand-charcoal"
            >
              {peso(serviceCharge)}
            </LeaderRow>
            <LeaderRow
              term="Total"
              className="border-brand-line border-t pt-3"
              termClassName="text-brand-charcoal font-serif text-xl"
              valueClassName="text-brand-red font-serif text-xl"
            >
              {peso(shownTotal)}
            </LeaderRow>
          </dl>

          <div className="short:static short:mt-4 short:pb-0 short:px-0 bg-brand-cream short:pt-0 fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[390px] px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {hasUnavailable ? (
              <button
                type="button"
                disabled
                className="bg-brand-red tracking-label shadow-lift block w-full rounded-lg py-4 text-center text-sm font-bold text-white uppercase opacity-60"
              >
                Proceed to Checkout
              </button>
            ) : (
              <Link
                to={`/table/${table}/checkout`}
                className="bg-brand-red hover:bg-brand-red/90 tracking-label shadow-lift block w-full rounded-lg py-4 text-center text-sm font-bold text-white uppercase transition-colors duration-200"
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
