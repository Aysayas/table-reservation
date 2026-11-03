import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Plus, Search, SearchX, ShoppingBag } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import DishPhoto from '@/components/DishPhoto'
import EmptyState from '@/components/EmptyState'
import LoadError from '@/components/LoadError'
import Ornament from '@/components/Ornament'
import PageLoader from '@/components/PageLoader'
import Skeleton from '@/components/Skeleton'
import TrackHeading from '@/components/TrackHeading'
import { dishDescription } from '@/lib/dish'
import { readLastOrder, readTableToken } from '@/lib/tableToken'
import { getCategories, getMenuItems, getRecommendations } from '@/services/menu'
import { getTable } from '@/services/tables'
import { cartCount, cartTotal, useCart } from '@/stores/cart'
import type { MenuItem } from '@/types/db'

const peso = (amount: number) =>
  `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

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
  const {
    data: items = [],
    isLoading: itemsLoading,
    isFetched,
    isLoadingError,
    refetch,
  } = useQuery({ queryKey: ['menu-items'], queryFn: () => getMenuItems() })
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

  if (isLoading) return <PageLoader />

  if (!table) {
    return (
      <div className="bg-brand-cream min-h-[calc(100dvh-4rem)] px-4 py-16 text-center">
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
    .map((c, index) => ({ ...c, track: index + 1 }))
    .filter((c) => category === null || c.category_id === category)
    .map((c) => ({ ...c, items: matching.filter((i) => i.category_id === c.category_id) }))
    .filter((c) => c.items.length > 0)
  const count = cartCount(lines)
  const lastOrder = readLastOrder(id)
  const canOrder = !!token || !!readTableToken(id)
  const itemLink = (item: MenuItem) => `/table/${id}/menu/${item.item_id}`

  const addOne = (item: MenuItem) => {
    add(id, { item_id: item.item_id, name: item.name, price: item.price, quantity: 1, notes: '' })
    toast.success(`${item.name} added to cart`)
  }

  return (
    <div
      className={`bg-brand-cream min-h-[calc(100dvh-4rem)] pt-4 ${count ? 'short:pb-6 pb-28' : 'pb-10'}`}
    >
      <h1 className="sr-only">Table {table.table_number} menu</h1>
      <div className="space-y-3 px-4">
        {!canOrder && (
          <p
            role="alert"
            className="border-brand-red/30 bg-brand-red/5 text-brand-red rounded-lg border px-4 py-3 text-sm"
          >
            To order, please scan the QR code on your table again.
          </p>
        )}
        {lastOrder && (
          <Link
            to={`/table/${id}/orders?order=${lastOrder}`}
            className="bg-brand-charcoal hover:bg-brand-charcoal/90 flex items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm font-bold text-white transition-colors duration-200"
          >
            View your order #{lastOrder}
            <ArrowRight className="text-brand-gold size-4" />
          </Link>
        )}
        <label className="border-brand-line focus-within:border-brand-gold flex min-h-11 items-center gap-3 rounded-full border bg-white px-4 py-3">
          <Search className="text-brand-ink/70 size-5 shrink-0" />
          <span className="sr-only">Search menu</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search menu"
            className="placeholder:text-brand-ink/65 w-full bg-transparent text-sm outline-none"
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
                className={`inline-flex shrink-0 items-center rounded-full border px-4 py-2 text-xs font-bold tracking-[0.08em] whitespace-nowrap transition-colors duration-200 pointer-coarse:min-h-11 ${active ? 'bg-brand-charcoal border-brand-charcoal text-white' : 'border-brand-line text-brand-charcoal bg-white'}`}
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
                      <DishPhoto
                        name={item.name}
                        src={item.image_url}
                        className="h-24 w-32 rounded-lg"
                        letter="text-4xl"
                      />
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
          <Ornament className="mx-4 mt-6" />
        </section>
      )}

      {isLoadingError && (
        <div className="mt-8 px-4">
          <LoadError what="the menu" onRetry={() => refetch()} />
        </div>
      )}

      {itemsLoading && (
        <div className="mt-8 px-4">
          <p role="status" className="sr-only">
            Loading the menu…
          </p>
          <ul aria-hidden="true">
            {Array.from({ length: 6 }, (_, i) => (
              <li key={i} className="border-brand-line flex items-center gap-3 border-b py-3">
                <Skeleton className="size-16 shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-8 w-16 shrink-0" />
              </li>
            ))}
          </ul>
        </div>
      )}

      {isFetched && !isLoadingError && sections.length === 0 && (
        <EmptyState icon={SearchX} title="No dishes match your search." />
      )}

      {sections.map((section) => (
        <section
          key={section.category_id}
          aria-labelledby={`section-${section.category_id}`}
          className="mt-8 px-4"
        >
          <TrackHeading
            id={`section-${section.category_id}`}
            name={section.name}
            track={section.track}
            compact
          />
          <ul>
            {section.items.map((item) => (
              <li
                key={item.item_id}
                className={`border-brand-line flex items-center gap-3 border-b py-3 ${item.is_available ? '' : 'opacity-50'}`}
              >
                <Link to={itemLink(item)} className="flex min-w-0 flex-1 items-center gap-3">
                  <DishPhoto
                    name={item.name}
                    src={item.image_url}
                    className="size-16 shrink-0 rounded-md"
                  />
                  <span className="min-w-0">
                    <span className="text-brand-charcoal block text-sm font-semibold wrap-break-word">
                      {item.name}
                    </span>
                    {dishDescription(item.description) && (
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
                    className="border-brand-charcoal text-brand-charcoal hover:bg-brand-charcoal flex min-h-11 shrink-0 items-center gap-1 rounded-md border px-3 py-2 text-xs font-bold tracking-[0.08em] uppercase transition-colors duration-200 hover:text-white"
                  >
                    <Plus className="size-3.5" />
                    Add
                  </button>
                ) : (
                  <span className="text-brand-ink/70 shrink-0 text-xs font-bold tracking-[0.1em] uppercase">
                    Not available
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}

      {count > 0 && (
        <div className="short:static short:mt-4 short:pb-0 bg-brand-cream short:pt-0 fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[390px] px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
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
