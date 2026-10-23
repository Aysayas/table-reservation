import { useQuery } from '@tanstack/react-query'
import { ArrowRight, UtensilsCrossed } from 'lucide-react'
import { Link } from 'react-router-dom'
import RestaurantMap from '@/components/RestaurantMap'
import { groupHours } from '@/lib/hours'
import { getMenuItems } from '@/services/menu'
import { getOpeningHours, getSettings } from '@/services/settings'

const wrap = 'md:mx-auto md:max-w-5xl md:px-10'
const eyebrow = 'text-brand-red text-xs font-bold tracking-[0.25em] uppercase'
const title = 'text-brand-charcoal mt-3 font-serif text-4xl leading-tight md:text-5xl'
const button =
  'focus-visible:outline-brand-red block rounded-sm py-4 text-center text-xs font-bold tracking-[0.12em] md:text-sm md:tracking-[0.15em] uppercase transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2'
const footerLink = 'hover:text-brand-gold transition-colors duration-200'

export default function Home() {
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: getSettings })
  const { data: hours = [] } = useQuery({ queryKey: ['opening-hours'], queryFn: getOpeningHours })
  const { data: items = [] } = useQuery({ queryKey: ['menu-items'], queryFn: () => getMenuItems() })

  const popular = items.filter((item) => item.is_recommended && item.is_available).slice(0, 4)

  return (
    <div className="bg-brand-cream">
      <section className={`md:grid md:grid-cols-2 md:items-center md:gap-12 md:py-16 ${wrap}`}>
        <img
          src="/photos/stock-dining.jpg"
          alt="Restaurant dining area"
          className="h-60 w-full object-cover md:order-2 md:h-[26rem] md:rounded-t-full md:rounded-b-lg"
        />
        <div className="px-4 pt-8 pb-12 md:px-0 md:py-0">
          <p className={eyebrow}>Welcome to</p>
          <h1 className="text-brand-charcoal mt-3 font-serif text-5xl leading-tight lg:text-6xl">
            {settings?.restaurant_name}
          </h1>
          <p className="text-brand-ink/75 mt-4 text-base">
            Home-style Filipino dishes, served with heart.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3 md:max-w-md">
            <Link
              to="/reserve"
              className={`${button} bg-brand-red hover:bg-brand-red/90 text-white`}
            >
              Reserve a Table
            </Link>
            <Link
              to="/menu"
              className={`${button} border-brand-charcoal text-brand-charcoal hover:bg-brand-charcoal border hover:text-white`}
            >
              View Menu
            </Link>
          </div>
        </div>
      </section>

      <section className={`px-4 pb-14 md:pb-20 ${wrap}`}>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className={eyebrow}>From our kitchen</p>
            <h2 className={title}>Popular Dishes</h2>
          </div>
          <Link
            to="/menu"
            className="text-brand-red mb-1 flex items-center gap-1 text-sm font-semibold hover:underline"
          >
            See all
            <ArrowRight className="size-4" />
          </Link>
        </div>
        <ul className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {popular.map((item, index) => (
            <li
              key={item.item_id}
              className={`border-brand-gold/40 overflow-hidden rounded-lg border bg-white ${index >= 2 ? 'hidden md:block' : ''}`}
            >
              <div
                role="img"
                aria-label={`${item.name} photo`}
                className="bg-brand-cream text-brand-gold flex h-32 items-center justify-center md:h-40"
              >
                <UtensilsCrossed className="size-8" strokeWidth={1.25} />
              </div>
              <div className="px-3 py-3">
                <p className="text-brand-charcoal text-sm font-semibold">{item.name}</p>
                <p className="text-brand-red mt-1 text-sm font-bold">₱{item.price.toFixed(2)}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-brand-charcoal px-4 py-14 text-white md:py-20">
        <div className={`md:grid md:grid-cols-2 md:gap-12 ${wrap}`}>
          <div>
            <p className="text-brand-gold text-xs font-bold tracking-[0.25em] uppercase">
              Visit us
            </p>
            <h2 className="mt-3 font-serif text-4xl leading-tight md:text-5xl">Opening Hours</h2>
            <ul className="mt-8 overflow-hidden rounded-lg border border-white/10">
              {groupHours(hours).map((group) => (
                <li
                  key={group.days}
                  className="flex justify-between gap-4 border-b border-white/10 px-4 py-3.5 text-sm last:border-b-0"
                >
                  <span className="font-semibold">{group.days}</span>
                  <span className="text-white/75 tabular-nums">{group.time}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-14 md:mt-0">
            <p className="text-brand-gold text-xs font-bold tracking-[0.25em] uppercase">Find us</p>
            <h2 className="mt-3 font-serif text-4xl leading-tight md:text-5xl">Location</h2>
            <RestaurantMap settings={settings} className="mt-8 h-52 rounded-lg" />
            <p className="mt-4 text-sm leading-7 text-white/75">{settings?.address}</p>
          </div>
        </div>
      </section>

      <footer className="bg-brand-charcoal border-t border-white/10 px-4 py-10 text-white">
        <div className={`md:flex md:items-center md:justify-between ${wrap}`}>
          <nav aria-label="Footer" className="flex flex-col gap-3 text-sm md:flex-row md:gap-8">
            <Link to="/about" className={footerLink}>
              About Us
            </Link>
            <Link to="/reservation" className={footerLink}>
              Find My Reservation
            </Link>
            <Link to="/staff/login" className={footerLink}>
              Staff Login
            </Link>
          </nav>
          <p className="mt-8 text-xs text-white/60 md:mt-0">© {settings?.restaurant_name}</p>
        </div>
      </footer>
    </div>
  )
}
