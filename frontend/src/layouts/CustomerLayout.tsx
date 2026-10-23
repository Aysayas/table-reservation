import { useQuery } from '@tanstack/react-query'
import { Menu as MenuIcon, X } from 'lucide-react'
import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { getSettings } from '@/services/settings'

const navLink =
  'hover:text-brand-gold block border-b border-white/10 px-4 py-3.5 text-sm font-semibold tracking-[0.15em] uppercase transition-colors duration-200 last:border-b-0'
const wideNavLink =
  'hover:text-brand-gold text-xs font-semibold tracking-[0.15em] uppercase transition-colors duration-200'

export default function CustomerLayout() {
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: getSettings })
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const wide = !pathname.startsWith('/table')
  const words = settings?.restaurant_name.split(' ') ?? []
  const lastWord = words.pop()

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
              <Link to="/menu" className={wideNavLink}>
                Menu
              </Link>
              <Link to="/about" className={wideNavLink}>
                About
              </Link>
            </nav>
          )}
          <Link
            to="/reserve"
            onClick={() => setOpen(false)}
            className={`bg-brand-red hover:bg-brand-red/90 rounded-md px-3 py-2 text-xs font-bold tracking-[0.12em] text-white uppercase transition-colors duration-200 ${wide ? 'md:px-5 md:py-2.5' : ''}`}
          >
            Reserve
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
            <Link to="/menu" className={navLink} onClick={() => setOpen(false)}>
              Menu
            </Link>
            <Link to="/about" className={navLink} onClick={() => setOpen(false)}>
              About
            </Link>
          </nav>
        )}
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
