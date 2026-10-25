import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ArrowRight, Plus, UtensilsCrossed } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SiteFooter from '@/components/SiteFooter'
import { groupHours } from '@/lib/hours'
import { getMenuItems } from '@/services/menu'
import { getOpeningHours } from '@/services/settings'

const wrap = 'md:mx-auto md:max-w-6xl md:px-10'
const eyebrow = 'text-brand-red text-xs font-bold tracking-[0.25em] uppercase'
const button =
  'focus-visible:outline-brand-gold block rounded-sm px-3 py-4 text-center whitespace-nowrap md:px-6 text-xs font-bold tracking-[0.12em] uppercase transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 md:text-sm md:tracking-[0.15em]'
const field =
  'mt-2 w-full rounded-sm border border-white/40 bg-transparent px-3 py-3 text-sm font-normal tracking-normal text-white normal-case outline-none [color-scheme:dark] focus:border-brand-gold'
const fieldLabel = 'text-xs font-bold tracking-[0.2em] uppercase'

const features = [
  { title: 'Fresh seafood', text: 'Straight from Mindoro waters.' },
  { title: 'Family recipes', text: 'Passed down, never written.' },
  { title: 'Filipino flavour', text: 'Cooked the way we were taught.' },
  { title: 'Made with heart', text: 'Every plate, every guest.' },
]

export default function Home() {
  const navigate = useNavigate()
  const [today] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [pax, setPax] = useState('2')
  const { data: hours = [] } = useQuery({ queryKey: ['opening-hours'], queryFn: getOpeningHours })
  const { data: items = [] } = useQuery({ queryKey: ['menu-items'], queryFn: () => getMenuItems() })

  const popular = items.filter((item) => item.is_recommended && item.is_available).slice(0, 4)
  const hourGroups = groupHours(hours)
  const badge = hourGroups[0]

  const findTable = () => {
    const params = new URLSearchParams(Object.entries({ date, time, pax }).filter(([, v]) => v))
    navigate(`/reserve?${params}`)
  }

  return (
    <div className="bg-brand-cream">
      <section className="bg-brand-charcoal px-4 pt-10 pb-28 text-white md:pt-16 md:pb-32">
        <div className={`md:grid md:grid-cols-[1.15fr_1fr] md:items-center md:gap-12 ${wrap}`}>
          <div>
            <p className="font-display text-brand-gold text-4xl">Mabuhay!</p>
            <h1 className="mt-3 font-serif text-5xl leading-tight lg:text-[3.4rem]">
              Home-style Filipino, <span className="text-brand-red-light">served with heart.</span>
            </h1>
            <span aria-hidden="true" className="bg-brand-gold mt-8 block h-px w-16" />
            <p className="text-brand-cream/85 mt-6 max-w-md text-base leading-7">
              Family recipes, cooked the way they were taught to us, on the Nautical Highway in
              Calapan City.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3 md:flex md:gap-4">
              <Link
                to="/reserve"
                className={`${button} bg-brand-red hover:bg-brand-red/90 text-white`}
              >
                Reserve a Table
              </Link>
              <Link
                to="/menu"
                className={`${button} border border-white/80 text-white hover:bg-white/10`}
              >
                View Menu
              </Link>
            </div>
          </div>
          <div className="relative mt-10 md:mt-0">
            <img
              src="/photos/stock-filipino-feast.jpg"
              alt="A Filipino feast with lechon, pancit and kinilaw on a table"
              className="h-64 w-full rounded-lg object-cover md:h-[26rem]"
            />
            {badge && (
              <div className="bg-brand-cream border-brand-gold absolute -right-2 -bottom-6 flex size-32 flex-col items-center justify-center rounded-full border border-dashed text-center md:-right-6 md:size-36">
                <p className="text-brand-red text-[10px] font-bold tracking-[0.2em] uppercase">
                  {hourGroups.length === 1 ? 'Open daily' : badge.days}
                </p>
                <p className="text-brand-charcoal mt-1 font-serif text-lg leading-tight">
                  {badge.time.replace(/:00/g, '')}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className={`relative -mt-16 px-4 ${wrap}`}>
        <ul className="bg-brand-charcoal grid grid-cols-2 overflow-hidden rounded-lg border border-white/10 text-white md:grid-cols-4">
          {features.map((feature, index) => (
            <li
              key={feature.title}
              className="flex gap-3 border-white/10 px-4 py-5 odd:border-r md:border-r md:border-b-0 md:px-6 md:last:border-r-0 [&:nth-child(-n+2)]:border-b"
            >
              <span className="border-brand-gold text-brand-gold flex size-9 shrink-0 items-center justify-center rounded-full border font-serif text-sm">
                {index + 1}
              </span>
              <div>
                <p className="text-xs font-bold tracking-[0.15em] uppercase">{feature.title}</p>
                <p className="mt-1 text-xs text-white/70">{feature.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section
        className={`px-4 py-16 md:grid md:grid-cols-2 md:items-center md:gap-12 md:py-24 ${wrap}`}
      >
        <div>
          <p className={eyebrow}>Our story</p>
          <h2 className="text-brand-charcoal mt-3 font-serif text-4xl leading-tight md:text-5xl">
            More than a meal, <span className="text-brand-red">it's our heritage.</span>
          </h2>
          <p className="mt-5 text-sm leading-7">
            Get to know the place behind the food, on the Nautical Highway in Calapan City, Oriental
            Mindoro.
          </p>
          <Link
            to="/about"
            className="text-brand-red mt-6 inline-flex items-center gap-1 text-xs font-bold tracking-[0.2em] uppercase hover:underline"
          >
            Read our story
            <ArrowRight className="size-4" />
          </Link>
        </div>
        <img
          src="/photos/vencios-dining.png"
          alt="Vencio's Garden dining room"
          className="mt-10 h-64 w-full rounded-lg object-cover md:mt-0 md:h-80"
        />
      </section>

      <section className="bg-brand-charcoal px-4 py-16 text-white md:py-20">
        <div className={wrap}>
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-serif text-4xl leading-tight md:text-5xl">Popular Dishes</h2>
            <Link
              to="/menu"
              className="text-brand-gold mb-1 flex items-center gap-1 text-xs font-bold tracking-[0.15em] whitespace-nowrap uppercase hover:underline"
            >
              View full menu
              <ArrowRight className="size-4" />
            </Link>
          </div>
          <ul className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {popular.map((item, index) => (
              <li
                key={item.item_id}
                className={`flex flex-col overflow-hidden rounded-lg border border-white/10 bg-white/5 ${index >= 2 ? 'hidden md:flex' : ''}`}
              >
                <div
                  role="img"
                  aria-label={`${item.name} photo`}
                  className="text-brand-gold/60 flex h-32 items-center justify-center bg-white/5 md:h-44"
                >
                  <UtensilsCrossed className="size-8" strokeWidth={1.25} />
                </div>
                <div className="flex flex-1 flex-col px-4 py-4">
                  <p className="text-sm font-semibold">{item.name}</p>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                    <p className="text-brand-gold font-serif text-lg">₱{item.price.toFixed(2)}</p>
                    <Link
                      to="/menu"
                      aria-label={`See ${item.name} on the menu`}
                      className="bg-brand-red hover:bg-brand-red/90 flex size-8 shrink-0 items-center justify-center rounded-full transition-colors duration-200"
                    >
                      <Plus className="size-4" />
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-brand-red px-4 py-12 text-white">
        <div className={`lg:grid lg:grid-cols-[1fr_1.5fr] lg:items-end lg:gap-12 ${wrap}`}>
          <div>
            <h2 className="font-serif text-3xl leading-tight">Good food deserves great company.</h2>
            <p className="mt-2 text-sm text-white/85">
              Reserve your table and join us for a Filipino feast.
            </p>
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              findTable()
            }}
            className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-[1fr_1fr_minmax(9rem,1fr)_auto] md:items-end lg:mt-0"
          >
            <label className={fieldLabel}>
              Date
              <input
                type="date"
                min={today}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={field}
              />
            </label>
            <label className={fieldLabel}>
              Time
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className={field}
              />
            </label>
            <label className={fieldLabel}>
              Guests
              <select value={pax} onChange={(e) => setPax(e.target.value)} className={field}>
                {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n} className="text-brand-charcoal">
                    {n} {n === 1 ? 'guest' : 'guests'}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className={`${button} bg-brand-gold text-brand-charcoal hover:bg-brand-gold/90 self-end`}
            >
              Find a Table
            </button>
          </form>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
