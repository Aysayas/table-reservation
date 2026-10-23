import { useQuery } from '@tanstack/react-query'
import { Globe, Mail, Phone } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getOpeningHours, getSettings } from '@/services/settings'

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const weekOrder = [1, 2, 3, 4, 5, 6, 0]
const eyebrow = 'text-brand-red text-xs font-bold tracking-[0.25em] uppercase'
const title = 'text-brand-charcoal mt-3 font-serif text-4xl leading-tight'

function formatTime(time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  const suffix = hours < 12 ? 'AM' : 'PM'
  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${suffix}`
}

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
      <nav aria-label="Breadcrumb" className="px-4 pt-4 text-sm">
        <Link to="/" className="text-brand-red hover:underline">
          Home
        </Link>
        <span className="text-brand-ink/60"> / </span>
        <h1 className="text-brand-ink/75 inline">About Us</h1>
      </nav>

      <section className="px-4 pt-8 pb-14">
        <div className="text-center">
          <div aria-hidden="true" className="flex items-center justify-center gap-3">
            <span className="bg-brand-gold h-px w-14" />
            <span className="border-brand-gold h-3.5 w-2 rounded-full border" />
            <span className="bg-brand-gold h-px w-14" />
          </div>
          <p className={`${eyebrow} mt-4`}>Our heritage</p>
          <h2 className="text-brand-charcoal mt-3 font-serif text-5xl leading-tight">
            A Taste Handed Down
          </h2>
          <p className="font-display text-brand-red text-5xl">{settings?.restaurant_name}</p>
        </div>

        <div className="border-brand-gold/40 mt-8 rounded-t-full rounded-b-lg border bg-white p-1.5">
          <img
            src="/photos/stock-dining.jpg"
            alt="Restaurant dining area"
            className="h-72 w-full rounded-t-full rounded-b-md object-cover"
          />
        </div>

        <div className="mt-10">
          <p className="text-brand-charcoal font-serif text-xl leading-snug">
            <span className="text-brand-red float-left mr-2 font-serif text-6xl leading-[0.85]">
              O
            </span>
            ur recipes were never written down.
          </p>
          <p className="mt-5 text-sm leading-7">
            They were passed from hand to hand, kitchen to kitchen, generation to generation. At{' '}
            {settings?.restaurant_name}, we cook them the way they were taught to us, with patience,
            with respect, and with pride in every Filipino flavour.
          </p>
          <blockquote className="bg-brand-charcoal mt-8 rounded-lg px-5 py-5 font-serif text-lg leading-relaxed text-white italic">
            “This is our heritage. Today, it's on your plate.”
          </blockquote>
        </div>
      </section>

      <section className="bg-brand-charcoal px-4 py-14 text-white">
        <p className="text-brand-gold text-xs font-bold tracking-[0.25em] uppercase">Visit us</p>
        <h2 className="mt-3 font-serif text-4xl leading-tight">Opening Hours</h2>
        <ul className="mt-8 overflow-hidden rounded-lg border border-white/10">
          {weekOrder.map((day) => {
            const entry = hours.find((h) => h.day_of_week === day)
            const time =
              entry?.is_open && entry.open_time && entry.close_time
                ? `${formatTime(entry.open_time)} – ${formatTime(entry.close_time)}`
                : 'Closed'
            const isToday = day === today
            return (
              <li
                key={day}
                aria-current={isToday ? 'date' : undefined}
                className={`flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3.5 text-sm last:border-b-0 ${isToday ? 'bg-brand-red/20 border-l-brand-red border-l-2 font-bold' : ''}`}
              >
                <span className="flex items-center gap-2.5">
                  <span>{dayNames[day]}</span>
                  {isToday && (
                    <span className="bg-brand-red rounded-full px-2 py-0.5 text-[10px] font-bold tracking-[0.15em] uppercase">
                      Today
                    </span>
                  )}
                </span>
                <span className={`tabular-nums ${isToday ? '' : 'text-white/75'}`}>{time}</span>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="px-4 pt-14">
        <p className={eyebrow}>Find us</p>
        <h2 className={title}>Location</h2>
        {settings ? (
          <iframe
            title={`Map to ${settings.restaurant_name}`}
            src={`https://maps.google.com/maps?q=${encodeURIComponent(`${settings.restaurant_name} Hotel and Restaurant`)}&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="border-brand-gold/40 mt-8 h-52 w-full rounded-lg border"
          />
        ) : (
          <div role="img" aria-label="Map" className="mt-8 h-52 rounded-lg bg-neutral-200" />
        )}
        <p className="mt-4 text-sm leading-7">{settings?.address}</p>
      </section>

      <section className="px-4 pt-14 pb-16">
        <p className={eyebrow}>Get in touch</p>
        <h2 className={title}>Contact</h2>
        <dl className="mt-8 space-y-3">
          {contacts.map(({ label, value, href, icon: Icon }) => (
            <div
              key={label}
              className="border-brand-gold/40 flex items-center gap-4 rounded-lg border bg-white px-4 py-3.5"
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

      <footer className="bg-brand-charcoal h-14" />
    </div>
  )
}
