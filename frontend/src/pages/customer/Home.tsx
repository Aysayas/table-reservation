import { useQuery } from '@tanstack/react-query'
import { ArrowRight, UtensilsCrossed } from 'lucide-react'
import { Link } from 'react-router-dom'
import RestaurantMap from '@/components/RestaurantMap'
import { groupHours } from '@/lib/hours'
import { getMenuItems } from '@/services/menu'
import { getOpeningHours, getSettings } from '@/services/settings'

const wrap = 'md:mx-auto md:max-w-6xl md:px-10'
const eyebrow = 'text-brand-red text-xs font-bold tracking-[0.25em] uppercase'
const goldEyebrow = 'text-brand-gold text-xs font-bold tracking-[0.25em] uppercase'
const title = 'mt-3 font-serif text-4xl leading-tight md:text-5xl'
const button =
  'focus-visible:outline-brand-gold block rounded-sm px-6 py-4 text-center text-xs font-bold tracking-[0.12em] uppercase transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 md:text-sm md:tracking-[0.15em]'
const footerLink = 'hover:text-brand-gold transition-colors duration-200'

export default function Home() {
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: getSettings })
  const { data: hours = [] } = useQuery({ queryKey: ['opening-hours'], queryFn: getOpeningHours })
  const { data: items = [] } = useQuery({ queryKey: ['menu-items'], queryFn: () => getMenuItems() })

  const popular = items.filter((item) => item.is_recommended && item.is_available).slice(0, 4)
  const words = settings?.restaurant_name.split(' ') ?? []
  const lastWord = words.pop()

  return (
    <div className="bg-brand-cream">
      <section className="bg-brand-charcoal text-white">
        <div className={`md:grid md:grid-cols-2 md:items-center md:gap-12 md:py-16 ${wrap}`}>
          <img
            src="/photos/stock-dining.jpg"
            alt="Restaurant dining area"
            className="h-60 w-full object-cover md:order-2 md:h-[26rem] md:rounded-lg"
          />
          <div className="px-4 pt-8 pb-14 md:px-0 md:py-0">
            <p className="font-display text-brand-gold text-4xl">Mabuhay!</p>
            <h1 className="mt-2 font-serif text-5xl leading-tight lg:text-6xl">
              {settings?.restaurant_name}
            </h1>
            <span aria-hidden="true" className="bg-brand-gold mt-6 block h-px w-16" />
            <p className="text-brand-cream/85 mt-6 text-base leading-7">
              Home-style Filipino dishes, served with heart.
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
        </div>
      </section>

      <section className="bg-brand-charcoal border-t border-white/10 px-4 py-14 text-white md:py-20">
        <div className={wrap}>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className={goldEyebrow}>From our kitchen</p>
              <h2 className={title}>Popular Dishes</h2>
            </div>
            <Link
              to="/menu"
              className="text-brand-gold mb-1 flex items-center gap-1 text-xs font-bold tracking-[0.15em] uppercase hover:underline"
            >
              See all
              <ArrowRight className="size-4" />
            </Link>
          </div>
          <ul className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {popular.map((item, index) => (
              <li
                key={item.item_id}
                className={`overflow-hidden rounded-lg border border-white/10 bg-white/5 ${index >= 2 ? 'hidden md:block' : ''}`}
              >
                <div
                  role="img"
                  aria-label={`${item.name} photo`}
                  className="text-brand-gold/70 flex h-32 items-center justify-center bg-white/5 md:h-44"
                >
                  <UtensilsCrossed className="size-8" strokeWidth={1.25} />
                </div>
                <div className="px-4 py-4">
                  <p className="text-sm font-semibold">{item.name}</p>
                  <p className="text-brand-gold mt-2 font-serif text-lg">
                    ₱{item.price.toFixed(2)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={`px-4 py-14 md:grid md:grid-cols-2 md:gap-12 md:py-20 ${wrap}`}>
        <div>
          <p className={eyebrow}>Visit us</p>
          <h2 className={`text-brand-charcoal ${title}`}>Opening Hours</h2>
          <ul className="border-brand-gold/40 mt-8 overflow-hidden rounded-lg border bg-white">
            {groupHours(hours).map((group) => (
              <li
                key={group.days}
                className="border-brand-charcoal/10 flex justify-between gap-4 border-b px-4 py-3.5 text-sm last:border-b-0"
              >
                <span className="text-brand-charcoal font-semibold">{group.days}</span>
                <span className="text-brand-ink/75 tabular-nums">{group.time}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-14 md:mt-0">
          <p className={eyebrow}>Find us</p>
          <h2 className={`text-brand-charcoal ${title}`}>Location</h2>
          <RestaurantMap settings={settings} className="mt-8 h-52 rounded-lg" />
          <p className="mt-4 text-sm leading-7">{settings?.address}</p>
        </div>
      </section>

      <footer className="bg-brand-charcoal px-4 pt-14 pb-8 text-white">
        <div className={`md:grid md:grid-cols-3 md:gap-12 ${wrap}`}>
          <div>
            <p className="flex items-baseline gap-2">
              <span className="font-serif text-2xl font-bold">{words.join(' ')}</span>
              <span className="font-display text-brand-gold text-3xl">{lastWord}</span>
            </p>
            <p className="mt-3 text-sm text-white/70">
              Home-style Filipino dishes, served with heart.
            </p>
          </div>
          <nav aria-label="Footer" className="mt-10 md:mt-0">
            <p className={goldEyebrow}>Quick links</p>
            <div className="mt-4 flex flex-col gap-3 text-sm">
              <Link to="/about" className={footerLink}>
                About Us
              </Link>
              <Link to="/reservation" className={footerLink}>
                Find My Reservation
              </Link>
              <Link to="/staff/login" className={footerLink}>
                Staff Login
              </Link>
            </div>
          </nav>
        </div>
        <p
          className={`mt-12 border-t border-white/10 pt-6 text-center text-xs text-white/60 ${wrap}`}
        >
          © {settings?.restaurant_name}
        </p>
      </footer>
    </div>
  )
}
