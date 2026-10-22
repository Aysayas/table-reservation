import { useQuery } from '@tanstack/react-query'
import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getOpeningHours, getSettings } from '@/services/settings'

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const weekOrder = [1, 2, 3, 4, 5, 6, 0]

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
    <div className="pb-10">
      <div className="border-brand-sage/40 relative flex items-center justify-center border-b px-4 py-3">
        <button
          type="button"
          aria-label="Back"
          onClick={() => navigate(-1)}
          className="text-brand-green hover:bg-brand-cream absolute left-2 rounded p-1"
        >
          <ChevronLeft className="size-7" />
        </button>
        <h1 className="text-brand-brown text-lg font-bold">About Us</h1>
      </div>

      <div
        role="img"
        aria-label="Restaurant photo"
        className="h-50 border-b border-neutral-200 bg-neutral-100"
      />

      <div className="space-y-8 px-4 pt-6">
        <section>
          <h2 className="text-brand-brown text-xl font-bold">Our Story</h2>
          <p className="mt-3 text-sm leading-relaxed">
            {settings?.restaurant_name} is a garden restaurant with its own aquaponics farm. We
            serve warm, home-style Filipino dishes made with fresh greens, best shared with family
            and friends.
          </p>
        </section>

        <section>
          <h2 className="text-brand-brown text-xl font-bold">Opening Hours</h2>
          <ul className="mt-3">
            {weekOrder.map((day) => {
              const entry = hours.find((h) => h.day_of_week === day)
              const time =
                entry?.is_open && entry.open_time && entry.close_time
                  ? `${formatTime(entry.open_time)} – ${formatTime(entry.close_time)}`
                  : 'Closed'
              return (
                <li
                  key={day}
                  className="border-brand-sage/40 flex justify-between border-b py-2 text-sm"
                >
                  <span>{dayNames[day]}</span>
                  <span>{time}</span>
                </li>
              )
            })}
          </ul>
        </section>

        <section>
          <h2 className="text-brand-brown text-xl font-bold">Location</h2>
          <div
            role="img"
            aria-label="Map"
            className="mt-3 h-45 rounded border border-neutral-200 bg-neutral-100"
          />
          <p className="mt-3 text-sm">{settings?.address}</p>
        </section>

        <section>
          <h2 className="text-brand-brown text-xl font-bold">Contact</h2>
          <dl className="mt-3 space-y-2 text-sm">
            {contacts.map((contact) => (
              <div key={contact.label} className="flex justify-between gap-4">
                <dt className="text-brand-ink/70">{contact.label}</dt>
                <dd className="text-right">{contact.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  )
}
