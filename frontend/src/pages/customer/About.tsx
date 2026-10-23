import { useQuery } from '@tanstack/react-query'
import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getOpeningHours, getSettings } from '@/services/settings'

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const weekOrder = [1, 2, 3, 4, 5, 6, 0]
const eyebrow =
  'text-brand-leaf flex items-center gap-3 text-xs font-semibold tracking-[0.22em] uppercase before:bg-brand-gold before:h-px before:w-6'
const title = 'text-brand-brown mt-2 text-2xl font-bold tracking-tight'
const row = 'border-brand-sage/30 flex justify-between gap-4 border-b py-3 text-sm'

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
      <div className="border-brand-sage/30 relative flex h-16 items-center justify-center border-b px-4">
        <button
          type="button"
          aria-label="Back"
          onClick={() => navigate(-1)}
          className="text-brand-green hover:bg-brand-cream focus-visible:outline-brand-leaf absolute left-3 flex size-10 items-center justify-center rounded-full transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <ChevronLeft className="size-6" strokeWidth={1.5} />
        </button>
        <h1 className="text-brand-green text-base font-semibold tracking-wide">About Us</h1>
      </div>

      <div className="px-4 pt-6">
        <div role="img" aria-label="Restaurant photo" className="h-56 rounded-md bg-neutral-100" />
      </div>

      <div className="space-y-12 px-4 pt-12">
        <section>
          <p className={eyebrow}>Our heritage</p>
          <h2 className={title}>Our Story</h2>
          <p className="font-display text-brand-green mt-6 text-4xl">{settings?.restaurant_name}</p>
          <div className="mt-4 max-w-[60ch] space-y-4 text-sm leading-7">
            <p>
              Our recipes were never written down. They were passed from hand to hand, kitchen to
              kitchen, generation to generation.
            </p>
            <p>
              At {settings?.restaurant_name}, we cook them the way they were taught to us, with
              patience, with respect, and with pride in every Filipino flavour.
            </p>
            <p className="text-brand-brown font-semibold">
              This is our heritage. Today, it's on your plate.
            </p>
          </div>
        </section>

        <section>
          <p className={eyebrow}>Visit us</p>
          <h2 className={title}>Opening Hours</h2>
          <ul className="border-brand-sage/30 mt-6 border-t">
            {weekOrder.map((day) => {
              const entry = hours.find((h) => h.day_of_week === day)
              const time =
                entry?.is_open && entry.open_time && entry.close_time
                  ? `${formatTime(entry.open_time)} – ${formatTime(entry.close_time)}`
                  : 'Closed'
              return (
                <li key={day} className={row}>
                  <span className="text-brand-brown font-semibold">{dayNames[day]}</span>
                  <span className="tabular-nums">{time}</span>
                </li>
              )
            })}
          </ul>
        </section>

        <section>
          <p className={eyebrow}>Find us</p>
          <h2 className={title}>Location</h2>
          <div role="img" aria-label="Map" className="mt-6 h-48 rounded-md bg-neutral-100" />
          <p className="mt-4 text-sm leading-7">{settings?.address}</p>
        </section>

        <section>
          <p className={eyebrow}>Get in touch</p>
          <h2 className={title}>Contact</h2>
          <dl className="border-brand-sage/30 mt-6 border-t">
            {contacts.map((contact) => (
              <div key={contact.label} className={row}>
                <dt className="text-brand-ink/70 text-xs font-semibold tracking-[0.15em] uppercase">
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
