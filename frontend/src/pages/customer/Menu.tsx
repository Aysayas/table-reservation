import { useQuery } from '@tanstack/react-query'
import { QrCode, Search, UtensilsCrossed } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getCategories, getMenuItems } from '@/services/menu'
import type { MenuItem } from '@/types/db'

const peso = (amount: number) =>
  `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const panel = 'lg:border-brand-line lg:rounded-xl lg:border lg:bg-white lg:p-6'
const panelTitle =
  'text-brand-charcoal border-brand-gold/60 hidden border-b border-dashed pb-3 text-xs font-bold tracking-[0.25em] uppercase lg:block'
const zoom =
  'motion-safe:transition-transform motion-safe:duration-700 motion-safe:group-hover:scale-105'

function Dish({ item, category }: { item: MenuItem; category: string }) {
  return (
    <li
      className={`group border-brand-line flex flex-col overflow-hidden rounded-xl border bg-white transition duration-300 hover:shadow-md motion-safe:hover:-translate-y-1 ${item.is_available ? '' : 'opacity-50'}`}
    >
      <div className="bg-brand-charcoal relative h-28 overflow-hidden md:h-32">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={`${item.name} photo`}
            className={`h-full w-full object-cover ${zoom}`}
          />
        ) : (
          <div
            role="img"
            aria-label={`${item.name} photo`}
            className="text-brand-gold/50 flex h-full items-center justify-center"
          >
            <UtensilsCrossed className={`size-7 ${zoom}`} strokeWidth={1.25} />
          </div>
        )}
        {item.is_recommended && (
          <span className="bg-brand-gold text-brand-charcoal absolute top-2 left-2 rounded-sm px-2 py-0.5 text-[9px] font-bold tracking-[0.15em] uppercase">
            Best Seller
          </span>
        )}
        <span className="bg-brand-red absolute right-2 bottom-0 max-w-[80%] truncate rounded-t-sm px-2 py-0.5 text-[9px] font-bold tracking-[0.1em] text-white uppercase">
          {category}
        </span>
      </div>
      <div className="flex flex-1 flex-col px-3 py-3 md:px-4">
        <h3 className="text-brand-charcoal text-sm leading-5 font-bold">{item.name}</h3>
        {item.description && (
          <p className="text-brand-ink/70 mt-1 line-clamp-2 text-xs leading-5">
            {item.description}
          </p>
        )}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          {item.is_available ? (
            <span />
          ) : (
            <span className="bg-brand-ink/10 text-brand-ink rounded-full px-2 py-0.5 text-[10px] font-bold tracking-[0.1em] uppercase">
              Not available
            </span>
          )}
          <p className="text-brand-red font-serif text-lg leading-none md:text-xl">
            {peso(item.price)}
          </p>
        </div>
      </div>
    </li>
  )
}

export default function Menu() {
  const [search, setSearch] = useState('')
  const [maxPrice, setMaxPrice] = useState<number | null>(null)
  const [bestOnly, setBestOnly] = useState(false)
  const [category, setCategory] = useState<number | null>(null)
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: getCategories })
  const { data: items = [], isFetched } = useQuery({
    queryKey: ['menu-items'],
    queryFn: () => getMenuItems(),
  })

  const categoryName = (id: number) => categories.find((c) => c.category_id === id)?.name ?? ''
  const term = search.trim().toLowerCase()
  const prices = items.map((i) => i.price)
  const lowest = prices.length ? Math.min(...prices) : 0
  const highest = prices.length ? Math.max(...prices) : 0
  const priceCap = maxPrice ?? highest
  const filtered = maxPrice !== null || bestOnly
  const matching = items.filter(
    (item) =>
      item.name.toLowerCase().includes(term) &&
      item.price <= priceCap &&
      (!bestOnly || item.is_recommended),
  )
  const sections = [
    ...(category === null
      ? [
          {
            id: 0,
            name: 'Popular',
            items: matching.filter((i) => i.is_recommended && i.is_available),
          },
        ]
      : []),
    ...categories
      .filter((c) => category === null || c.category_id === category)
      .map((c) => ({
        id: c.category_id,
        name: c.name,
        items: matching.filter((i) => i.category_id === c.category_id),
      })),
  ].filter((section) => section.items.length > 0)
  const choices = [
    { category_id: null, name: 'All', count: items.length },
    ...categories.map((c) => ({
      category_id: c.category_id,
      name: c.name,
      count: items.filter((i) => i.category_id === c.category_id).length,
    })),
  ]

  return (
    <div className="bg-brand-cream min-h-[calc(100vh-4rem)] pb-16">
      <section className="bg-brand-charcoal px-4 py-8 text-white md:py-14">
        <div className="md:mx-auto md:max-w-6xl md:px-10">
          <nav
            aria-label="Breadcrumb"
            className="text-xs tracking-[0.15em] text-white/60 uppercase"
          >
            <Link to="/" className="hover:text-brand-gold transition-colors duration-200">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-white">Menu</span>
          </nav>
          <div className="mt-6 md:text-center">
            <p className="font-display text-brand-gold text-3xl md:text-4xl">Kain na!</p>
            <h1 className="font-serif text-4xl md:text-6xl">Our Menu</h1>
            <span
              aria-hidden="true"
              className="bg-brand-gold mt-3 block h-px w-12 md:mx-auto md:mt-5"
            />
          </div>
        </div>
      </section>

      <div className="md:mx-auto md:max-w-6xl md:px-10 lg:mt-10 lg:grid lg:grid-cols-[17rem_1fr] lg:items-start lg:gap-8">
        <aside className="max-lg:contents lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:[scrollbar-width:thin] lg:space-y-6 lg:overflow-y-auto">
          <div className={`px-4 pt-6 lg:px-6 ${panel}`}>
            <p className={panelTitle}>Search</p>
            <label className="border-brand-line focus-within:border-brand-gold flex items-center overflow-hidden rounded-md border bg-white lg:mt-4">
              <span className="sr-only">Search menu</span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search menu"
                className="placeholder:text-brand-ink/50 w-full bg-transparent px-4 py-3 text-sm outline-none"
              />
              <span className="bg-brand-red flex self-stretch px-3.5 text-white">
                <Search className="my-auto size-4" />
              </span>
            </label>
          </div>

          <div className={`px-4 pt-4 lg:px-6 lg:pt-6 ${panel}`}>
            <div className="flex items-center justify-between">
              <p className={panelTitle}>Filters</p>
              {filtered && (
                <button
                  type="button"
                  onClick={() => {
                    setMaxPrice(null)
                    setBestOnly(false)
                  }}
                  className="text-brand-red ml-auto text-xs font-bold hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 lg:mt-4 lg:block lg:space-y-5">
              <label className="block min-w-48 flex-1">
                <span className="text-brand-charcoal flex justify-between text-xs font-bold">
                  Max price
                  <span className="text-brand-ink/70 font-normal tabular-nums">
                    {peso(lowest)} – {peso(priceCap)}
                  </span>
                </span>
                <input
                  type="range"
                  min={lowest}
                  max={highest}
                  step={1}
                  value={priceCap}
                  onChange={(e) => {
                    const value = Number(e.target.value)
                    setMaxPrice(value >= highest ? null : value)
                  }}
                  className="accent-brand-red mt-2 w-full"
                />
              </label>
              <button
                type="button"
                aria-pressed={bestOnly}
                onClick={() => setBestOnly(!bestOnly)}
                className={`rounded-full border px-4 py-2 text-xs font-bold tracking-[0.08em] transition-colors duration-200 ${bestOnly ? 'bg-brand-gold border-brand-gold text-brand-charcoal' : 'border-brand-line text-brand-charcoal hover:border-brand-gold bg-white'}`}
              >
                Best Seller
              </button>
            </div>
          </div>

          <nav
            aria-label="Menu categories"
            className={`bg-brand-cream/95 sticky top-0 z-10 mt-4 py-3 backdrop-blur-sm lg:static lg:mt-0 lg:backdrop-blur-none ${panel}`}
          >
            <p className={panelTitle}>Categories</p>
            <div className="flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 lg:mt-3 lg:flex-col lg:gap-0 lg:px-0">
              {choices.map((c) => {
                const active = category === c.category_id
                return (
                  <button
                    key={c.name}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setCategory(c.category_id)}
                    className={`flex shrink-0 items-center justify-between gap-3 rounded-full border px-4 py-2 text-xs font-bold tracking-[0.08em] whitespace-nowrap transition-colors duration-200 lg:rounded-none lg:border-0 lg:border-b lg:border-dashed lg:px-0 lg:py-2.5 lg:text-sm lg:font-medium lg:tracking-normal lg:last:border-b-0 ${active ? 'bg-brand-charcoal border-brand-charcoal lg:text-brand-red lg:border-brand-line/70 text-white lg:bg-transparent lg:font-bold' : 'border-brand-line text-brand-charcoal hover:border-brand-gold lg:border-brand-line/70 lg:hover:text-brand-red bg-white lg:bg-transparent'}`}
                  >
                    <span>
                      <span aria-hidden="true" className="mr-2 hidden text-[10px] lg:inline">
                        ▸
                      </span>
                      {c.name}
                    </span>
                    <span className={active ? 'opacity-80' : 'opacity-60'}>({c.count})</span>
                  </button>
                )
              })}
            </div>
          </nav>
        </aside>

        <div className="px-4 lg:px-0">
          {isFetched && sections.length === 0 && (
            <p className="text-brand-ink/70 mt-10 text-center text-sm">
              No dishes match your search.
            </p>
          )}

          {sections.map((section) => (
            <section
              key={section.id}
              aria-labelledby={`section-${section.id}`}
              className="mt-10 first:mt-6 lg:first:mt-0"
            >
              <h2
                id={`section-${section.id}`}
                className="text-brand-charcoal font-serif text-2xl md:text-3xl"
              >
                {section.name}
              </h2>
              <span aria-hidden="true" className="bg-brand-gold mt-3 block h-px w-12" />
              <ul className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
                {section.items.map((item) => (
                  <Dish
                    key={`${section.id}-${item.item_id}`}
                    item={item}
                    category={categoryName(item.category_id)}
                  />
                ))}
              </ul>
            </section>
          ))}

          <p className="bg-brand-charcoal mt-12 flex items-center gap-3 rounded-xl px-5 py-5 text-sm text-white">
            <QrCode className="text-brand-gold size-6 shrink-0" />
            Dining in? Scan the QR code on your table to order.
          </p>
        </div>
      </div>
    </div>
  )
}
