import { useQuery } from '@tanstack/react-query'
import { Menu as MenuIcon, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { getSettings } from '@/services/settings'

const navLink =
  'hover:text-brand-gold block border-b border-white/10 px-4 py-3.5 text-sm font-semibold tracking-[0.15em] uppercase transition-colors duration-200 last:border-b-0'
const wideNavLink = ({ isActive }: { isActive: boolean }) =>
  `hover:text-brand-gold border-b pb-1 text-xs font-semibold tracking-[0.15em] uppercase transition-colors duration-200 ${isActive ? 'text-brand-gold border-brand-gold' : 'border-transparent'}`
const customerLinks = [
  { to: '/', label: 'Home' },
  { to: '/menu', label: 'Menu' },
  { to: '/about', label: 'About' },
  { to: '/reservation', label: 'Find My Reservation' },
]
const tableLinks = customerLinks.slice(1, 3)

export default function CustomerLayout() {
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: getSettings })
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const wide = !pathname.startsWith('/table')
  const words = settings?.restaurant_name.split(' ') ?? []
  const lastWord = words.pop()
  const panelLinks = wide ? customerLinks : tableLinks

  return (
    <div
      className={`mx-auto min-h-screen max-w-[390px] border-x border-neutral-200 ${wide ? 'md:max-w-none md:border-x-0' : ''}`}
    >
      <header
        className={`bg-brand-charcoal relative flex items-center justify-between gap-2 border-b border-white/10 px-3 py-3 min-[380px]:px-4 ${wide ? 'md:px-10 md:py-4 lg:px-16' : ''}`}
      >
        <Link to="/" className="flex shrink-0 items-center gap-2" onClick={() => setOpen(false)}>
          <span className={`size-8 overflow-hidden rounded-full ${wide ? 'md:size-10' : ''}`}>
            <img
              src={settings?.logo_url ?? '/logo.png'}
              alt=""
              className="size-full scale-[2.2] object-cover object-top"
            />
          </span>
          <span className="flex items-baseline gap-1.5 whitespace-nowrap">
            <span className={`font-serif text-lg font-bold text-white ${wide ? 'md:text-xl' : ''}`}>
              {words.join(' ')}
            </span>
            <span className={`font-display text-brand-gold text-2xl ${wide ? 'md:text-3xl' : ''}`}>
              {lastWord}
            </span>
          </span>
        </Link>
        <div className={`flex shrink-0 items-center gap-2 ${wide ? 'md:gap-8' : ''}`}>
          {wide && (
            <nav aria-label="Main" className="text-brand-cream hidden items-center gap-8 md:flex">
              {customerLinks.map((link) => (
                <NavLink key={link.to} to={link.to} end className={wideNavLink}>
                  {link.label}
                </NavLink>
              ))}
            </nav>
          )}
          <Link
            to="/reserve"
            onClick={() => setOpen(false)}
            className={`bg-brand-red hover:bg-brand-red/90 rounded-md px-3 py-2 text-xs font-bold tracking-[0.12em] text-white uppercase transition-colors duration-200 ${wide ? 'md:px-5 md:py-2.5' : ''}`}
          >
            Reserve
            {wide && <span className="hidden md:inline"> a Table</span>}
          </Link>
          <button
            type="button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            className={`text-brand-cream hover:text-brand-gold flex size-9 items-center justify-center rounded-md border border-white/20 transition-colors duration-200 ${wide ? 'md:hidden' : ''}`}
          >
            {open ? <X className="size-5" /> : <MenuIcon className="size-5" />}
          </button>
        </div>
        {open && (
          <nav
            className={`bg-brand-charcoal text-brand-cream absolute inset-x-0 top-full z-10 border-t border-white/10 shadow-lg ${wide ? 'md:hidden' : ''}`}
          >
            {panelLinks.map((link) => (
              <Link key={link.to} to={link.to} className={navLink} onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
