import { useQuery } from '@tanstack/react-query'
import { Globe, Mail, Phone } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import FramedPhoto from '@/components/FramedPhoto'
import Ornament from '@/components/Ornament'
import RestaurantMap from '@/components/RestaurantMap'
import Reveal from '@/components/Reveal'
import SiteFooter from '@/components/SiteFooter'
import { dayNames, hoursText, weekOrder } from '@/lib/hours'
import { directionsUrl } from '@/lib/maps'
import { getOpeningHours, getSettings } from '@/services/settings'

const wrap = 'md:mx-auto md:max-w-6xl md:px-10'
const eyebrow = 'text-brand-red text-xs font-bold tracking-[0.25em] uppercase'
const goldEyebrow = 'text-brand-gold text-xs font-bold tracking-[0.25em] uppercase'
const button =
  'focus-visible:outline-brand-gold block rounded-sm px-3 py-4 text-center whitespace-nowrap md:px-6 text-xs font-bold tracking-[0.12em] uppercase transition duration-200 motion-safe:hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 md:text-sm md:tracking-[0.15em]'
const card = 'rounded-lg border border-white/10 bg-white/5 p-4 md:p-6'
const cardTitle = 'font-serif text-2xl'

const values = [
  { title: 'Patience', text: 'Cooked slowly, the way it was taught.' },
  { title: 'Respect', text: 'For the recipes and the hands that kept them.' },
  { title: 'Pride', text: 'In every Filipino flavour we serve.' },
  { title: 'Hospitality', text: 'Every guest welcomed like family.' },
]

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
      <section
        aria-label="Our heritage"
        className="bg-brand-charcoal relative overflow-hidden px-4 pt-6 pb-28 text-white md:pb-32"
      >
        <div className="absolute inset-y-0 right-0 w-full md:w-[70%]">
          <img
            src="/photos/vencios-building.jpg"
            alt="Vencio's Garden Hotel and Restaurant building"
            className="h-full w-full object-cover opacity-30 md:[mask-image:linear-gradient(to_right,transparent,rgb(0_0_0/0.45)_35%,black_75%)] md:opacity-90"
          />
          <div
            aria-hidden="true"
            className="from-brand-charcoal via-brand-charcoal/90 to-brand-charcoal/40 absolute inset-0 bg-gradient-to-r md:hidden"
          />
        </div>
        <span aria-hidden="true" className="sm:gold-corners pointer-events-none absolute inset-0" />
        <div className={`relative ${wrap}`}>
          <nav aria-label="Breadcrumb" className="text-sm">
            <Link
              to="/"
              className="text-brand-gold inline-flex items-center hover:underline pointer-coarse:min-h-11"
            >
              Home
            </Link>
            <span className="text-white/60"> / </span>
            <h1 className="inline text-white/80">About Us</h1>
          </nav>
          <div className="max-w-xl pt-12 md:pt-20">
            <p className="font-display text-brand-gold text-4xl">Our Heritage</p>
            <h2 className="mt-3 font-serif text-5xl leading-tight lg:text-6xl">
              A Taste Handed Down.
            </h2>
            <span aria-hidden="true" className="bg-brand-gold mt-8 block h-px w-16" />
            <p className="text-brand-cream/85 mt-6 text-base leading-7">
              Home-style Filipino dishes, served with heart on the Nautical Highway in Calapan City,
              Oriental Mindoro.
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

      <section aria-label="Our values" className={`relative -mt-16 px-4 ${wrap}`}>
        <Reveal>
          <ul className="bg-brand-charcoal grid grid-cols-2 overflow-hidden rounded-lg border border-white/10 text-white lg:grid-cols-4">
            {values.map((value, index) => (
              <li
                key={value.title}
                className="group flex gap-3 border-white/10 px-4 py-5 odd:border-r max-[400px]:flex-col md:px-6 lg:border-r lg:last:border-r-0 [&:nth-child(-n+2)]:border-b lg:[&:nth-child(-n+2)]:border-b-0"
              >
                <span className="border-brand-gold text-brand-gold group-hover:bg-brand-gold group-hover:text-brand-charcoal flex size-9 shrink-0 items-center justify-center rounded-full border font-serif text-sm transition-colors duration-300">
                  {index + 1}
                </span>
                <div>
                  <p className="text-xs font-bold tracking-[0.15em] uppercase">{value.title}</p>
                  <p className="mt-1 text-xs text-white/70">{value.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      <Ornament className="mx-auto max-w-xs px-4 pt-14 md:pt-20" />

      <Reveal
        className={`px-4 pt-10 pb-16 md:grid md:grid-cols-2 md:items-center md:gap-12 md:pt-14 md:pb-24 ${wrap}`}
      >
        <div>
          <p className={eyebrow}>Our story</p>
          <h2 className="text-brand-charcoal mt-3 font-serif text-4xl leading-tight md:text-5xl">
            We cook our recipes the way they were taught to us.
          </h2>
          <p className="mt-5 text-sm leading-7 md:text-base md:leading-[1.8]">
            At {settings?.restaurant_name}, every dish is made with patience, with respect, and with
            pride in every Filipino flavour.
          </p>
          <blockquote className="border-brand-gold text-brand-charcoal mt-8 border-l-4 pl-5 font-serif text-xl leading-relaxed italic">
            “This is our heritage. Today, it's on your plate.”
          </blockquote>
        </div>
        <FramedPhoto className="mt-10 md:mt-0">
          <div className="group overflow-hidden rounded-lg">
            <img
              src="/photos/vencios-counter.jpg"
              alt="Vencio's Garden counter"
              className="h-72 w-full object-cover motion-safe:transition-transform motion-safe:duration-700 motion-safe:group-hover:scale-105 md:h-[26rem]"
            />
          </div>
        </FramedPhoto>
      </Reveal>

      <section className="bg-brand-charcoal px-4 py-16 text-white md:py-24">
        <Reveal className={wrap}>
          <p className={goldEyebrow}>Visit us</p>
          <h2 className="mt-3 font-serif text-4xl leading-tight md:text-5xl">Plan Your Visit</h2>
          <div className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[1.3fr_1fr_1fr]">
            <div className={card}>
              <h3 className={cardTitle}>Opening Hours</h3>
              <ul className="mt-6 overflow-hidden rounded-lg border border-white/10">
                {weekOrder.map((day) => {
                  const time = hoursText(hours.find((h) => h.day_of_week === day))
                  const isToday = day === today
                  return (
                    <li
                      key={day}
                      aria-current={isToday ? 'date' : undefined}
                      className={`flex flex-wrap items-center justify-between gap-x-3 border-b border-white/10 px-4 py-3 text-sm last:border-b-0 ${isToday ? 'bg-brand-red/20 border-l-brand-red border-l-2 font-bold' : ''}`}
                    >
                      <span className="flex items-center gap-2.5">
                        <span>{dayNames[day]}</span>
                        {isToday && (
                          <span className="bg-brand-red rounded-full px-2 py-0.5 text-xs font-bold tracking-[0.15em] uppercase">
                            Today
                          </span>
                        )}
                      </span>
                      <span
                        className={`whitespace-nowrap tabular-nums ${isToday ? '' : 'text-white/75'}`}
                      >
                        {time}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>

            <div className={`${card} flex flex-col`}>
              <h3 className={cardTitle}>Location</h3>
              <RestaurantMap settings={settings} className="mt-6 h-52 rounded-lg" />
              <p className="mt-4 text-sm leading-7 text-white/85">{settings?.address}</p>
              <a
                href={directionsUrl(settings?.restaurant_name)}
                target="_blank"
                rel="noreferrer"
                className="border-brand-gold text-brand-gold hover:bg-brand-gold/10 mt-auto block rounded-sm border py-4 text-center text-xs font-bold tracking-[0.2em] uppercase transition-colors duration-200"
              >
                Get Directions
              </a>
            </div>

            <div className={card}>
              <h3 className={cardTitle}>Contact</h3>
              <dl className="mt-6 space-y-3">
                {contacts.map(({ label, value, href, icon: Icon }) => (
                  <div
                    key={label}
                    className="flex items-center gap-4 rounded-lg border border-white/10 px-4 py-3.5"
                  >
                    <Icon className="text-brand-gold size-5 shrink-0" strokeWidth={1.5} />
                    <div className="min-w-0">
                      <dt className="text-xs font-semibold tracking-[0.15em] text-white/60 uppercase">
                        {label}
                      </dt>
                      <dd className="mt-0.5 text-sm">
                        <a
                          href={href}
                          target={label === 'Facebook' ? '_blank' : undefined}
                          rel={label === 'Facebook' ? 'noreferrer' : undefined}
                          className="hover:text-brand-gold inline-block break-words transition-colors duration-200 pointer-coarse:-my-3 pointer-coarse:py-3"
                        >
                          {value}
                        </a>
                      </dd>
                    </div>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </Reveal>
      </section>

      <SiteFooter>
        <p className="font-display text-brand-gold text-4xl">Salamat, and see you soon!</p>
      </SiteFooter>
    </div>
  )
}
