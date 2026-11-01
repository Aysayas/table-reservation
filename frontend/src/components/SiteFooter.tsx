import { useQuery } from '@tanstack/react-query'
import { ArrowRight } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { Link } from 'react-router-dom'
import { groupHours } from '@/lib/hours'
import { directionsUrl } from '@/lib/maps'
import { getOpeningHours, getSettings } from '@/services/settings'

const wrap = 'md:mx-auto md:max-w-6xl md:px-10'
const goldEyebrow = 'text-brand-gold text-xs font-bold tracking-[0.25em] uppercase'
const footerLink =
  'hover:text-brand-gold inline-flex min-h-11 items-center transition-colors duration-200'

export default function SiteFooter({ children }: { children?: ReactNode }) {
  const [year] = useState(() => new Date().getFullYear())
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: getSettings })
  const { data: hours = [] } = useQuery({ queryKey: ['opening-hours'], queryFn: getOpeningHours })

  const hourGroups = groupHours(hours)
  const words = settings?.restaurant_name.split(' ') ?? []
  const lastWord = words.pop()

  return (
    <footer className="bg-brand-charcoal px-4 pt-14 pb-8 text-white">
      {children && <div className={`mb-12 text-center ${wrap}`}>{children}</div>}
      <div className={`grid gap-10 md:grid-cols-4 md:gap-12 ${wrap}`}>
        <div>
          <p className="flex items-baseline gap-2">
            <span className="font-serif text-2xl font-bold">{words.join(' ')}</span>
            <span className="font-display text-brand-gold text-3xl">{lastWord}</span>
          </p>
          <p className="mt-3 text-sm text-white/70">
            Home-style Filipino dishes, served with heart.
          </p>
        </div>
        <nav aria-label="Footer">
          <p className={goldEyebrow}>Quick links</p>
          <div className="mt-2 flex flex-col items-start text-sm">
            <Link to="/about" className={footerLink}>
              About Us
            </Link>
            <Link to="/menu" className={footerLink}>
              Menu
            </Link>
            <Link to="/reservation" className={footerLink}>
              Find My Reservation
            </Link>
            <Link to="/staff/login" className={footerLink}>
              Staff Login
            </Link>
          </div>
        </nav>
        <div>
          <p className={goldEyebrow}>Hours</p>
          <ul className="mt-4 space-y-2 text-sm">
            {hourGroups.map((group) => (
              <li key={group.days}>
                <p>{group.days}</p>
                <p className="text-white/70">{group.time}</p>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className={goldEyebrow}>Location</p>
          <p className="mt-4 text-sm leading-6">{settings?.address}</p>
          <a
            href={directionsUrl(settings?.restaurant_name)}
            target="_blank"
            rel="noreferrer"
            className="text-brand-gold mt-3 inline-flex items-center gap-1 text-sm font-semibold hover:underline"
          >
            Get directions
            <ArrowRight className="size-4" />
          </a>
        </div>
      </div>
      <p
        className={`mt-12 border-t border-white/10 pt-6 text-center text-xs text-white/60 ${wrap}`}
      >
        © {year} {settings?.restaurant_name}
      </p>
    </footer>
  )
}
