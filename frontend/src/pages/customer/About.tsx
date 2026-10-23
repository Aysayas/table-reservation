import { useQuery } from '@tanstack/react-query'
import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getOpeningHours, getSettings } from '@/services/settings'

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const weekOrder = [1, 2, 3, 4, 5, 6, 0]
const eyebrow =
  'text-brand-gold-deep flex items-center gap-3 text-xs font-semibold tracking-[0.22em] uppercase before:bg-brand-gold before:h-px before:w-6'
const title = 'text-brand-charcoal mt-2 text-3xl font-semibold tracking-tight'
const row = 'border-brand-charcoal/10 flex justify-between gap-4 border-b py-3 text-sm'

function formatTime(time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  const suffix = hours < 12 ? 'AM' : 'PM'
  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${suffix}`
}

export default function About() {
  const navigate = useNavigate()
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: getSettings })
  const { data: hours = [] } = useQuery({ queryKey: ['opening-hours'], queryFn: getOpeningHours })

  const contacts = [
    { label: 'Phone', value: settings?.contact_number },
    { label: 'Email', value: settings?.email },
    { label: 'Facebook', value: settings?.facebook_url },
  ]

  return (
    <div className="pb-16">
      <div className="bg-brand-charcoal relative flex h-16 items-center justify-center px-4">
        <button
          type="button"
          aria-label="Back"
          onClick={() => navigate(-1)}
          className="text-brand-gold focus-visible:outline-brand-gold absolute left-3 flex size-10 items-center justify-center rounded-full transition-colors duration-200 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <ChevronLeft className="size-6" strokeWidth={1.5} />
        </button>
        <h1 className="text-sm font-semibold tracking-[0.2em] text-white uppercase">About Us</h1>
      </div>

      <div className="px-4 pt-6">
        <img
          src="/photos/restaurant-interior.jpg"
          alt="Restaurant photo"
          className="h-56 w-full rounded-md object-cover"
        />
      </div>

      <div className="space-y-12 px-4 pt-12">
        <section>
          <p className={eyebrow}>Our heritage</p>
          <h2 className={title}>Our Story</h2>
          <p className="font-display text-brand-gold-deep mt-6 text-4xl">
            {settings?.restaurant_name}
          </p>
          <div className="mt-4 max-w-[60ch] space-y-4 text-sm leading-7">
            <p>
              Our recipes were never written down. They were passed from hand to hand, kitchen to
              kitchen, generation to generation.
            </p>
            <p>
              At {settings?.restaurant_name}, we cook them the way they were taught to us, with
              patience, with respect, and with pride in every Filipino flavour.
            </p>
            <p className="text-brand-gold-deep font-semibold">
              This is our heritage. Today, it's on your plate.
            </p>
          </div>
        </section>

        <section>
          <p className={eyebrow}>Visit us</p>
          <h2 className={title}>Opening Hours</h2>
          <ul className="border-brand-charcoal/10 mt-6 border-t">
            {weekOrder.map((day) => {
              const entry = hours.find((h) => h.day_of_week === day)
              const time =
                entry?.is_open && entry.open_time && entry.close_time
                  ? `${formatTime(entry.open_time)} – ${formatTime(entry.close_time)}`
                  : 'Closed'
              return (
                <li key={day} className={row}>
                  <span className="text-brand-charcoal font-semibold">{dayNames[day]}</span>
                  <span className="tabular-nums">{time}</span>
                </li>
              )
            })}
          </ul>
        </section>

        <section>
          <p className={eyebrow}>Find us</p>
          <h2 className={title}>Location</h2>
          {settings ? (
            <iframe
              title="Map"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(`${settings.restaurant_name} Hotel and Restaurant`)}&output=embed`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="mt-6 h-48 w-full rounded-md border-0"
            />
          ) : (
            <div role="img" aria-label="Map" className="mt-6 h-48 rounded-md bg-neutral-100" />
          )}
          <p className="mt-4 text-sm leading-7">{settings?.address}</p>
        </section>

        <section>
          <p className={eyebrow}>Get in touch</p>
          <h2 className={title}>Contact</h2>
          <dl className="border-brand-charcoal/10 mt-6 border-t">
            {contacts.map((contact) => (
              <div key={contact.label} className={row}>
                <dt className="text-brand-gold-deep text-xs font-semibold tracking-[0.15em] uppercase">
                  {contact.label}
                </dt>
                <dd className="text-right break-all">{contact.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  )
}
