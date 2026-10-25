import { useQuery } from '@tanstack/react-query'
import { Globe, Mail, Phone } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import RestaurantMap from '@/components/RestaurantMap'
import SiteFooter from '@/components/SiteFooter'
import { dayNames, hoursText, weekOrder } from '@/lib/hours'
import { directionsUrl } from '@/lib/maps'
import { getOpeningHours, getSettings } from '@/services/settings'

const eyebrow = 'text-brand-red text-xs font-bold tracking-[0.25em] uppercase'
const wrap = 'md:mx-auto md:max-w-6xl md:px-10'
const title = 'text-brand-charcoal mt-3 font-serif text-4xl leading-tight'

export default function About() {
  const [today] = useState(() => new Date().getDay())
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: getSettings })
  const { data: hours = [] } = useQuery({ queryKey: ['opening-hours'], queryFn: getOpeningHours })

  const contacts = [
    {
      label: 'Phone',
      value: settings?.contact_number,
      href: `tel:${settings?.contact_number?.replace(/\s/g, '')}`,
      icon: Phone,
    },
    { label: 'Email', value: settings?.email, href: `mailto:${settings?.email}`, icon: Mail },
    {
      label: 'Facebook',
      value: settings?.facebook_url?.replace(/^https?:\/\/(www\.)?facebook\.com/, ''),
      href: settings?.facebook_url ?? undefined,
      icon: Globe,
    },
  ]

  return (
    <div className="bg-brand-cream">
      <nav aria-label="Breadcrumb" className={`px-4 pt-4 text-sm md:pt-6 ${wrap}`}>
        <Link to="/" className="text-brand-red hover:underline">
          Home
        </Link>
        <span className="text-brand-ink/60"> / </span>
        <h1 className="text-brand-ink/75 inline">About Us</h1>
      </nav>

      <section className={`px-4 pt-8 pb-14 md:pb-20 ${wrap}`}>
        <div className="text-center">
          <div aria-hidden="true" className="flex items-center justify-center gap-3">
            <span className="bg-brand-gold h-px w-14" />
            <span className="border-brand-gold h-3.5 w-2 rounded-full border" />
            <span className="bg-brand-gold h-px w-14" />
          </div>
          <p className={`${eyebrow} mt-4`}>Our heritage</p>
          <h2 className="text-brand-charcoal mt-3 font-serif text-5xl leading-tight lg:text-6xl">
            A Taste Handed Down
          </h2>
          <p className="font-display text-brand-red text-5xl lg:text-6xl">
            {settings?.restaurant_name}
          </p>
        </div>

        <div className="md:mt-12 md:grid md:grid-cols-2 md:items-center md:gap-12">
          <div className="border-brand-line mt-8 rounded-t-full rounded-b-lg border bg-white p-1.5 md:mt-0">
            <img
              src="/photos/stock-dining.jpg"
              alt="Restaurant dining area"
              className="h-72 w-full rounded-t-full rounded-b-md object-cover md:h-[28rem]"
            />
          </div>

          <div className="mt-10 md:mt-0">
            <p className="text-brand-charcoal first-letter:text-brand-red font-serif text-xl leading-snug first-letter:text-[1.8em] md:text-[1.75rem]">
              Our recipes were never written down.
            </p>
            <p className="mt-5 text-sm leading-7 md:text-base md:leading-[1.8]">
              They were passed from hand to hand, kitchen to kitchen, generation to generation. At{' '}
              {settings?.restaurant_name}, we cook them the way they were taught to us, with
              patience, with respect, and with pride in every Filipino flavour.
            </p>
            <blockquote className="bg-brand-charcoal mt-8 rounded-lg px-5 py-5 font-serif text-lg leading-relaxed text-white italic">
              “This is our heritage. Today, it's on your plate.”
            </blockquote>
          </div>
        </div>
      </section>

      <div className={`md:grid md:grid-cols-2 md:gap-10 md:pb-20 lg:grid-cols-3 ${wrap}`}>
        <section className="bg-brand-charcoal px-4 py-14 text-white md:bg-transparent md:p-0 md:text-inherit">
          <p className="text-brand-gold md:text-brand-red text-xs font-bold tracking-[0.25em] uppercase">
            Visit us
          </p>
          <h2 className="md:text-brand-charcoal mt-3 font-serif text-4xl leading-tight">
            Opening Hours
          </h2>
          <ul className="md:border-brand-line mt-8 overflow-hidden rounded-lg border border-white/10 md:bg-white">
            {weekOrder.map((day) => {
              const time = hoursText(hours.find((h) => h.day_of_week === day))
              const isToday = day === today
              return (
                <li
                  key={day}
                  aria-current={isToday ? 'date' : undefined}
                  className={`md:border-brand-line flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3.5 text-sm last:border-b-0 ${isToday ? 'bg-brand-red/20 border-l-brand-red md:bg-brand-red/5 border-l-2 font-bold' : ''}`}
                >
                  <span className="md:text-brand-charcoal flex items-center gap-2.5">
                    <span>{dayNames[day]}</span>
                    {isToday && (
                      <span className="bg-brand-red rounded-full px-2 py-0.5 text-[10px] font-bold tracking-[0.15em] text-white uppercase">
                        Today
                      </span>
                    )}
                  </span>
                  <span
                    className={`tabular-nums ${isToday ? 'md:text-brand-charcoal' : 'md:text-brand-ink/75 text-white/75'}`}
                  >
                    {time}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="px-4 pt-14 md:px-0 md:pt-0">
          <p className={eyebrow}>Find us</p>
          <h2 className={title}>Location</h2>
          <RestaurantMap settings={settings} className="mt-8 h-52 rounded-lg" />
          <p className="mt-4 text-sm leading-7">{settings?.address}</p>
          <a
            href={directionsUrl(settings?.restaurant_name)}
            target="_blank"
            rel="noreferrer"
            className="bg-brand-charcoal border-brand-gold text-brand-gold hover:bg-brand-charcoal/90 mt-5 block rounded-sm border py-4 text-center text-xs font-bold tracking-[0.2em] uppercase transition-colors duration-200"
          >
            Get Directions
          </a>
        </section>

        <section className="px-4 pt-14 pb-16 md:px-0 md:pt-0 md:pb-0">
          <p className={eyebrow}>Get in touch</p>
          <h2 className={title}>Contact</h2>
          <dl className="mt-8 space-y-3">
            {contacts.map(({ label, value, href, icon: Icon }) => (
              <div
                key={label}
                className="border-brand-line flex items-center gap-4 rounded-lg border bg-white px-4 py-3.5"
              >
                <Icon className="text-brand-red size-5 shrink-0" strokeWidth={1.5} />
                <div className="min-w-0">
                  <dt className="text-brand-ink/70 text-[11px] font-semibold tracking-[0.15em] uppercase">
                    {label}
                  </dt>
                  <dd className="mt-0.5 text-sm">
                    <a
                      href={href}
                      target={label === 'Facebook' ? '_blank' : undefined}
                      rel={label === 'Facebook' ? 'noreferrer' : undefined}
                      className="text-brand-charcoal hover:text-brand-red break-words transition-colors duration-200"
                    >
                      {value}
                    </a>
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <SiteFooter>
        <p className="font-display text-brand-gold text-4xl">Salamat, and see you soon!</p>
      </SiteFooter>
    </div>
  )
}
