import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Minus, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import DishPhoto from '@/components/DishPhoto'
import LoadError from '@/components/LoadError'
import Ornament from '@/components/Ornament'
import PageLoader from '@/components/PageLoader'
import { dishDescription } from '@/lib/dish'
import { getMenuItem, getRecommendations } from '@/services/menu'
import { flyToCart } from '@/lib/flyToCart'
import { useCart } from '@/stores/cart'
import type { MenuItem } from '@/types/db'

const peso = (amount: number) =>
  `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function ItemDetails() {
  const navigate = useNavigate()
  const { tableId = '', itemId = '' } = useParams()
  const table = Number(tableId)
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const add = useCart((s) => s.add)
  const {
    data: item,
    isLoading,
    isLoadingError,
    refetch,
  } = useQuery({
    queryKey: ['menu-item', Number(itemId)],
    queryFn: () => getMenuItem(Number(itemId)),
  })
  const { data: often = [] } = useQuery({
    queryKey: ['recommendations', [Number(itemId)]],
    queryFn: () => getRecommendations([Number(itemId)], 2),
  })
  const menuLink = `/table/${table}/menu`

  if (isLoading) return <PageLoader />

  if (isLoadingError && !item) {
    return (
      <div className="bg-brand-cream min-h-[calc(100dvh-4rem)] px-4 py-16">
        <div className="mx-auto max-w-md">
          <LoadError what="this dish" onRetry={() => refetch()} />
        </div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="bg-brand-cream min-h-[calc(100dvh-4rem)] px-4 py-16 text-center">
        <h1 className="text-brand-charcoal font-serif text-3xl">Dish not found</h1>
        <Link
          to={menuLink}
          className="text-brand-red mt-4 inline-flex min-h-11 items-center text-sm font-bold underline"
        >
          Back to the menu
        </Link>
      </div>
    )
  }

  const line = (dish: MenuItem, qty: number, note: string) => ({
    item_id: dish.item_id,
    name: dish.name,
    price: dish.price,
    quantity: qty,
    notes: note,
  })

  return (
    <div className="bg-brand-cream short:pb-6 min-h-[calc(100dvh-4rem)] pb-28">
      <div className="relative">
        <DishPhoto
          name={item.name}
          src={item.image_url}
          className={item.image_url ? 'h-60 w-full' : 'h-36 w-full'}
          letter="text-6xl"
        />
        <button
          type="button"
          aria-label="Back"
          onClick={() => navigate(-1)}
          className="text-brand-charcoal hover:bg-brand-cream shadow-soft absolute top-4 left-4 flex size-11 items-center justify-center rounded-full bg-white/90 transition-colors duration-200"
        >
          <ArrowLeft className="size-5" />
        </button>
      </div>

      <div className="px-4 pt-5">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-brand-charcoal min-w-0 font-serif text-2xl leading-tight wrap-break-word">
            {item.name}
          </h1>
          <p className="text-brand-red shrink-0 font-serif text-2xl">{peso(item.price)}</p>
        </div>
        {dishDescription(item.description) && (
          <p className="text-brand-ink/75 mt-3 text-sm leading-6">{item.description}</p>
        )}

        <div
          role="group"
          aria-labelledby="quantity-label"
          className="mt-6 flex items-center justify-between"
        >
          <p id="quantity-label" className="text-brand-charcoal text-sm font-bold">
            Quantity
          </p>
          <div className="border-brand-line inline-flex items-center rounded-lg border bg-white">
            <button
              type="button"
              aria-label="Less"
              disabled={quantity <= 1}
              onClick={() => setQuantity(quantity - 1)}
              className="text-brand-charcoal flex size-11 items-center justify-center disabled:opacity-40"
            >
              <Minus className="size-4" />
            </button>
            <output
              aria-live="polite"
              className="border-brand-line text-brand-charcoal w-10 border-x py-2 text-center font-semibold"
            >
              {quantity}
            </output>
            <button
              type="button"
              aria-label="More"
              disabled={quantity >= 99}
              onClick={() => setQuantity(quantity + 1)}
              className="text-brand-charcoal flex size-11 items-center justify-center disabled:opacity-40"
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>

        <label className="text-brand-charcoal mt-6 block text-sm font-bold">
          Notes (optional)
          <textarea
            rows={3}
            maxLength={255}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. less spicy"
            className="border-brand-line focus:border-brand-gold placeholder:text-brand-ink/65 mt-2 block w-full resize-none rounded-lg border bg-white px-4 py-3 text-sm font-normal outline-none"
          />
        </label>

        {often.length > 0 && (
          <section aria-labelledby="often" className="mt-8">
            <Ornament className="mb-6" />
            <h2 id="often" className="text-brand-charcoal font-serif text-xl">
              Often Ordered With
            </h2>
            <ul className="mt-3 grid grid-cols-2 gap-3">
              {often.map((dish) => (
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
                    onClick={(e) => {
                      flyToCart(e.currentTarget)
                      add(table, line(dish, 1, ''))
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
      </div>

      <div className="short:static short:mt-4 short:pb-0 bg-brand-cream short:pt-0 fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[390px] px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          disabled={!item.is_available}
          onClick={() => {
            add(table, line(item, quantity, notes.trim()))
            setQuantity(1)
            setNotes('')
            toast.success(`${item.name} added to cart`, {
              action: { label: 'View Cart', onClick: () => navigate(`/table/${table}/cart`) },
            })
          }}
          className="bg-brand-red hover:bg-brand-red/90 tracking-label shadow-lift block w-full rounded-lg py-4 text-sm font-bold text-white uppercase transition-colors duration-200 disabled:opacity-60"
        >
          {item.is_available ? `Add to Cart · ${peso(item.price * quantity)}` : 'Not available'}
        </button>
      </div>
    </div>
  )
}
