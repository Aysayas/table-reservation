import { useQuery } from '@tanstack/react-query'
import { Plus, Search, ShoppingBag, UtensilsCrossed } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { getCategories, getMenuItems, getRecommendations } from '@/services/menu'
import { getTable } from '@/services/tables'
import { cartCount, cartTotal, useCart } from '@/stores/cart'
import type { MenuItem } from '@/types/db'

const peso = (amount: number) =>
  `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function Photo({ item, className }: { item: MenuItem; className: string }) {
  return item.image_url ? (
    <img src={item.image_url} alt={`${item.name} photo`} className={`${className} object-cover`} />
  ) : (
    <div
      role="img"
      aria-label={`${item.name} photo`}
      className={`${className} bg-brand-charcoal text-brand-gold/60 flex items-center justify-center`}
    >
      <UtensilsCrossed className="size-6" strokeWidth={1.25} />
    </div>
  )
}

export default function TableMenu() {
  const { tableId = '' } = useParams()
  const id = Number(tableId)
  const [params] = useSearchParams()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<number | null>(null)
  const { data: table, isLoading } = useQuery({
    queryKey: ['table', id],
    queryFn: () => getTable(id),
  })
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: getCategories })
  const { data: items = [] } = useQuery({ queryKey: ['menu-items'], queryFn: () => getMenuItems() })
  const add = useCart((s) => s.add)
  const cartTable = useCart((s) => s.tableId)
  const allLines = useCart((s) => s.lines)
  const lines = cartTable === id ? allLines : []
  const cartIds = lines.map((l) => l.item_id)
  const { data: recs = [] } = useQuery({
    queryKey: ['recommendations', cartIds],
    queryFn: () => getRecommendations(cartIds),
  })
  const token = params.get('t')

  useEffect(() => {
    if (!token) return
    try {
      sessionStorage.setItem(`qr_token:${id}`, token)
    } catch {
      toast.error("Couldn't remember your table. Please scan the QR code again before ordering.")
    }
  }, [id, token])

  if (isLoading) return null

  if (!table) {
    return (
      <div className="bg-brand-cream min-h-[calc(100vh-4rem)] px-4 py-16 text-center">
        <h1 className="text-brand-charcoal font-serif text-3xl">Table not found</h1>
        <p className="text-brand-ink/75 mt-3 text-sm">
          Please scan the QR code on your table again.
        </p>
      </div>
    )
  }

  const term = search.trim().toLowerCase()
  const matching = items.filter((item) => item.name.toLowerCase().includes(term))
  const recommended = recs.filter((i) => i.name.toLowerCase().includes(term))
  const sections = categories
    .filter((c) => category === null || c.category_id === category)
    .map((c) => ({ ...c, items: matching.filter((i) => i.category_id === c.category_id) }))
    .filter((c) => c.items.length > 0)
  const count = cartCount(lines)
  const itemLink = (item: MenuItem) => `/table/${id}/menu/${item.item_id}`

  const addOne = (item: MenuItem) => {
    add(id, { item_id: item.item_id, name: item.name, price: item.price, quantity: 1, notes: '' })
    toast.success(`${item.name} added to cart`)
  }

  return (
    <div className={`bg-brand-cream min-h-[calc(100vh-4rem)] pt-4 ${count ? 'pb-28' : 'pb-10'}`}>
      <h1 className="sr-only">Table {table.table_number} menu</h1>
      <div className="px-4">
        <label className="border-brand-line focus-within:border-brand-gold flex items-center gap-3 rounded-full border bg-white px-4 py-3">
          <Search className="text-brand-ink/60 size-5 shrink-0" />
          <span className="sr-only">Search menu</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search menu"
            className="placeholder:text-brand-ink/50 w-full bg-transparent text-sm outline-none"
          />
        </label>
      </div>

      <nav
        aria-label="Menu categories"
        className="bg-brand-cream/95 sticky top-0 z-10 mt-3 py-3 backdrop-blur-sm"
      >
        <div className="flex [scrollbar-width:none] gap-2 overflow-x-auto px-4">
          {[{ category_id: null, name: 'All' }, ...categories].map((c) => {
            const active = category === c.category_id
            return (
              <button
                key={c.name}
                type="button"
                aria-pressed={active}
                onClick={() => setCategory(c.category_id)}
                className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold tracking-[0.08em] whitespace-nowrap transition-colors duration-200 ${active ? 'bg-brand-charcoal border-brand-charcoal text-white' : 'border-brand-line text-brand-charcoal bg-white'}`}
              >
                {c.name}
              </button>
            )
          })}
        </div>
      </nav>

      {category === null && recommended.length > 0 && (
        <section aria-labelledby="recommended" className="mt-4">
          <h2 id="recommended" className="text-brand-charcoal px-4 font-serif text-2xl">
            Recommended for You
          </h2>
          <div className="group/marquee mt-3 [scrollbar-width:none] overflow-x-auto motion-safe:overflow-hidden">
            <ul className="motion-safe:animate-marquee flex px-4 pb-1 motion-safe:w-max motion-safe:pr-0 motion-safe:group-focus-within/marquee:[animation-play-state:paused] motion-safe:group-hover/marquee:[animation-play-state:paused] motion-safe:group-active/marquee:[animation-play-state:paused]">
              {[...recommended, ...recommended].map((item, index) => {
                const copy = index >= recommended.length
                return (
                  <li
                    key={`${item.item_id}-${copy}`}
                    aria-hidden={copy || undefined}
                    inert={copy}
                    className={`mr-3 w-32 shrink-0 ${copy ? 'motion-reduce:hidden' : ''}`}
                  >
                    <Link to={itemLink(item)} className="block">
                      <Photo item={item} className="h-24 w-32 rounded-lg" />
                      <p className="text-brand-charcoal mt-2 line-clamp-2 text-xs font-semibold">
                        {item.name}
                      </p>
                      <p className="text-brand-red mt-0.5 font-serif text-sm">{peso(item.price)}</p>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </section>
      )}

      {sections.length === 0 && (
        <p className="text-brand-ink/70 mt-10 text-center text-sm">No dishes match your search.</p>
      )}

      {sections.map((section) => (
        <section
          key={section.category_id}
          aria-labelledby={`section-${section.category_id}`}
          className="mt-8 px-4"
        >
          <h2
            id={`section-${section.category_id}`}
            className="text-brand-charcoal font-serif text-2xl"
          >
            {section.name}
          </h2>
          <span aria-hidden="true" className="bg-brand-gold mt-2 block h-px w-10" />
          <ul>
            {section.items.map((item) => (
              <li
                key={item.item_id}
                className={`border-brand-line flex items-center gap-3 border-b py-3 ${item.is_available ? '' : 'opacity-50'}`}
              >
                <Link to={itemLink(item)} className="flex min-w-0 flex-1 items-center gap-3">
                  <Photo item={item} className="size-16 shrink-0 rounded-md" />
                  <span className="min-w-0">
                    <span className="text-brand-charcoal block text-sm font-semibold">
                      {item.name}
                    </span>
                    {item.description && (
                      <span className="text-brand-ink/70 mt-0.5 line-clamp-1 block text-xs">
                        {item.description}
                      </span>
                    )}
                    <span className="text-brand-red mt-1 block font-serif text-base">
                      {peso(item.price)}
                    </span>
                  </span>
                </Link>
                {item.is_available ? (
                  <button
                    type="button"
                    aria-label={`Add ${item.name}`}
                    onClick={() => addOne(item)}
                    className="border-brand-charcoal text-brand-charcoal hover:bg-brand-charcoal flex shrink-0 items-center gap-1 rounded-md border px-3 py-2 text-xs font-bold tracking-[0.08em] uppercase transition-colors duration-200 hover:text-white"
                  >
                    <Plus className="size-3.5" />
                    Add
                  </button>
                ) : (
                  <span className="text-brand-ink/70 shrink-0 text-[10px] font-bold tracking-[0.1em] uppercase">
                    Not available
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}

      {count > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[390px] px-4 pb-4">
          <Link
            to={`/table/${id}/cart`}
            className="bg-brand-charcoal hover:bg-brand-charcoal/90 flex items-center justify-between gap-3 rounded-lg px-5 py-4 text-sm font-bold text-white shadow-lg transition-colors duration-200"
          >
            <span className="flex items-center gap-2">
              <ShoppingBag className="text-brand-gold size-4" />
              View Cart · {count} {count === 1 ? 'item' : 'items'}
            </span>
            <span className="text-brand-gold font-serif text-base">{peso(cartTotal(lines))}</span>
          </Link>
        </div>
      )}
    </div>
  )
}
