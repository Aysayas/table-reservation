import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, QrCode, Search, UtensilsCrossed } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCategories, getMenuItems } from '@/services/menu'
import type { MenuItem } from '@/types/db'

const peso = (amount: number) =>
  `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const chip =
  'shrink-0 rounded-full border px-4 py-2 text-xs font-bold tracking-[0.1em] whitespace-nowrap uppercase transition-colors duration-200'

function Dish({ item }: { item: MenuItem }) {
  return (
    <li
      className={`border-brand-line flex gap-4 border-b py-4 md:rounded-lg md:border md:bg-white md:p-4 ${item.is_available ? '' : 'opacity-50'}`}
    >
      {item.image_url ? (
        <img
          src={item.image_url}
          alt={`${item.name} photo`}
          className="size-20 shrink-0 rounded-md object-cover"
        />
      ) : (
        <div
          role="img"
          aria-label={`${item.name} photo`}
          className="bg-brand-charcoal text-brand-gold/60 flex size-20 shrink-0 items-center justify-center rounded-md"
        >
          <UtensilsCrossed className="size-6" strokeWidth={1.25} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h3 className="text-brand-charcoal text-sm font-semibold">{item.name}</h3>
        {item.description && (
          <p className="text-brand-ink/70 mt-1 line-clamp-2 text-xs leading-5">
            {item.description}
          </p>
        )}
        <div className="mt-2 flex items-center gap-3">
          <p className="text-brand-red font-serif text-lg">{peso(item.price)}</p>
          {!item.is_available && (
            <span className="bg-brand-ink/10 text-brand-ink rounded-full px-2 py-0.5 text-[10px] font-bold tracking-[0.1em] uppercase">
              Not available
            </span>
          )}
        </div>
      </div>
    </li>
  )
}

export default function Menu() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<number | null>(null)
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: getCategories })
  const { data: items = [], isFetched } = useQuery({
    queryKey: ['menu-items'],
    queryFn: () => getMenuItems(),
  })

  const term = search.trim().toLowerCase()
  const matching = items.filter((item) => item.name.toLowerCase().includes(term))
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

  return (
    <div className="bg-brand-cream min-h-[calc(100vh-4rem)] pb-16">
      <div className="px-4 pt-6 md:mx-auto md:max-w-5xl md:px-10 md:pt-12">
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Back"
            onClick={() => navigate(-1)}
            className="border-brand-line text-brand-charcoal hover:border-brand-gold flex size-10 shrink-0 items-center justify-center rounded-full border bg-white transition-colors duration-200"
          >
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="text-brand-charcoal font-serif text-3xl md:text-4xl">Menu</h1>
        </div>

        <label className="border-brand-line focus-within:border-brand-gold mt-6 flex items-center gap-3 rounded-full border bg-white px-4 py-3">
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
        className="bg-brand-cream/95 sticky top-0 z-10 mt-4 py-3 backdrop-blur-sm md:static md:bg-transparent md:backdrop-blur-none"
      >
        <div className="flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 md:mx-auto md:max-w-5xl md:flex-wrap md:px-10">
          {[{ category_id: null, name: 'All' }, ...categories].map((c) => {
            const active = category === c.category_id
            return (
              <button
                key={c.name}
                type="button"
                aria-pressed={active}
                onClick={() => setCategory(c.category_id)}
                className={`${chip} ${active ? 'bg-brand-charcoal border-brand-charcoal text-white' : 'border-brand-line text-brand-charcoal hover:border-brand-gold bg-white'}`}
              >
                {c.name}
              </button>
            )
          })}
        </div>
      </nav>

      <div className="px-4 md:mx-auto md:max-w-5xl md:px-10">
        <p className="bg-brand-charcoal mt-4 flex items-center justify-center gap-3 rounded-lg px-4 py-4 text-center text-sm text-white">
          <QrCode className="text-brand-gold size-5 shrink-0" />
          Scan the QR code on your table to order
        </p>

        {isFetched && sections.length === 0 && (
          <p className="text-brand-ink/70 mt-10 text-center text-sm">
            No dishes match your search.
          </p>
        )}

        {sections.map((section) => (
          <section key={section.id} aria-labelledby={`section-${section.id}`} className="mt-10">
            <h2
              id={`section-${section.id}`}
              className="text-brand-charcoal font-serif text-2xl md:text-3xl"
            >
              {section.name}
            </h2>
            <span aria-hidden="true" className="bg-brand-gold mt-3 block h-px w-12" />
            <ul className="mt-2 md:mt-5 md:grid md:grid-cols-2 md:gap-4">
              {section.items.map((item) => (
                <Dish key={`${section.id}-${item.item_id}`} item={item} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
