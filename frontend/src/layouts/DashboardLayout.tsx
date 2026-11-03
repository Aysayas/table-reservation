import { useQuery } from '@tanstack/react-query'
import { LogOut, Menu as MenuIcon, X } from 'lucide-react'
import { Fragment, useEffect, useRef, useState } from 'react'
import {
  Link,
  Navigate,
  NavLink,
  Outlet,
  useLocation,
  useMatches,
  useNavigate,
} from 'react-router-dom'
import { getMe, logout, roleHome } from '@/services/auth'
import { roleNames } from '@/services/users'
import { getSettings } from '@/services/settings'
import type { UserRole } from '@/types/db'

export type NavItem = {
  to: string
  label: string
  title?: string
  group?: string
}

type Props = {
  title: string
  items: NavItem[]
}

export default function DashboardLayout({ title, items }: Props) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    const opener = menuButton.current
    closeButton.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const wide = window.matchMedia('(min-width: 1024px)')
    const onWide = () => setOpen(false)
    document.addEventListener('keydown', onKey)
    wide.addEventListener('change', onWide)
    return () => {
      document.removeEventListener('keydown', onKey)
      wide.removeEventListener('change', onWide)
      opener?.focus()
    }
  }, [open])
  const role = title.toLowerCase() as UserRole
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: getSettings })
  const { data: me } = useQuery({
    queryKey: ['me', role],
    queryFn: () => getMe(role),
    retry: false,
  })
  const signOut = async (e: React.MouseEvent) => {
    e.preventDefault()
    await logout().catch(() => undefined)
    navigate('/staff/login')
  }
  const current = [...items]
    .sort((a, b) => b.to.length - a.to.length)
    .find((i) => pathname.startsWith(i.to))
  const pageTitle = useMatches()
    .map((m) => (m.handle as { title?: string } | undefined)?.title)
    .findLast(Boolean)
  const words = settings?.restaurant_name.split(' ') ?? []
  const lastWord = words.pop()
  const initials = (me?.full_name ?? '')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
  const allowed = role === 'admin' ? ['admin'] : ['staff', 'admin']

  if (me && !allowed.includes(me.role)) return <Navigate to={roleHome(me.role)} replace />

  return (
    <div className="bg-brand-cream flex min-h-dvh print:bg-white">
      {open && (
        <div
          aria-hidden="true"
          onClick={() => setOpen(false)}
          className="bg-brand-charcoal/50 fixed inset-0 z-30 lg:hidden print:hidden"
        />
      )}
      <aside
        className={`bg-brand-charcoal fixed inset-y-0 left-0 z-40 flex w-[calc(18rem+env(safe-area-inset-left))] flex-col overflow-y-auto pt-6 pr-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] text-white duration-200 motion-reduce:transition-none lg:visible lg:sticky lg:top-0 lg:z-auto lg:h-dvh lg:w-60 lg:shrink-0 lg:translate-x-0 print:hidden ${open ? 'visible translate-x-0 transition-transform' : 'invisible -translate-x-full transition-[transform,visibility]'}`}
      >
        <button
          ref={closeButton}
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="absolute top-3.5 right-2 flex size-11 items-center justify-center text-white/75 hover:text-white lg:hidden"
        >
          <X className="size-5" />
        </button>
        <Link to={items[0].to} className="flex items-center gap-2 px-2">
          <span className="size-9 overflow-hidden rounded-full">
            <img
              src={settings?.logo_url ?? '/logo.png'}
              alt=""
              className="size-full scale-[2.2] object-cover object-top"
            />
          </span>
          <span className="flex items-baseline gap-1.5 whitespace-nowrap">
            <span className="font-serif text-lg font-bold">{words.join(' ')}</span>
            <span className="font-display text-brand-gold text-2xl">{lastWord}</span>
          </span>
        </Link>
        <p className="text-brand-gold mt-2 px-2 text-xs font-bold tracking-[0.3em] uppercase">
          {title}
        </p>
        <nav aria-label={`${title} menu`} className="mt-8 flex flex-1 flex-col gap-1">
          {items.map((item, index) => (
            <Fragment key={item.to}>
              {item.group && item.group !== items[index - 1]?.group && (
                <p
                  className={`text-brand-gold px-3 pb-1 text-xs font-bold tracking-[0.25em] uppercase ${index > 0 ? 'pt-5' : ''}`}
                >
                  {item.group}
                </p>
              )}
              <NavLink
                to={item.to}
                end={item.to.split('/').length === 2}
                state={item.to === '/kitchen' ? { from: pathname } : undefined}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2.5 text-sm font-semibold transition-colors duration-200 ${isActive ? 'bg-brand-red text-white shadow-[inset_3px_0_0_var(--color-brand-gold)]' : 'text-white/75 hover:bg-white/10 hover:text-white'}`
                }
              >
                {item.label}
              </NavLink>
            </Fragment>
          ))}
        </nav>
        <p className="mt-6 px-3 text-sm sm:hidden">
          <span className="block font-semibold">{me?.full_name}</span>
          {me && <span className="block text-xs text-white/75">{roleNames[me.role]}</span>}
        </p>
        <Link
          to="/staff/login"
          onClick={signOut}
          className="mt-4 flex items-center gap-2 border-t border-white/10 px-3 pt-4 text-sm text-white/75 transition-colors duration-200 hover:text-white lg:mt-0"
        >
          <LogOut className="size-4" />
          Log Out
        </Link>
      </aside>

      <div inert={open} className="min-w-0 flex-1">
        <a
          href="#main"
          className="focus:bg-brand-gold focus:text-brand-charcoal sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-sm focus:px-4 focus:py-2 focus:text-sm focus:font-bold"
        >
          Skip to content
        </a>
        <header className="border-brand-line flex items-center gap-3 border-b bg-white px-4 py-3 sm:px-6 lg:px-8 lg:py-4 print:hidden">
          <button
            ref={menuButton}
            type="button"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="text-brand-charcoal -ml-2 flex size-11 shrink-0 items-center justify-center lg:hidden"
          >
            <MenuIcon className="size-5" />
          </button>
          <h1 className="text-brand-charcoal min-w-0 flex-1 font-serif text-2xl font-bold lg:text-3xl">
            {pageTitle ?? current?.title ?? current?.label}
          </h1>
          <div className="text-brand-charcoal flex items-center gap-3">
            <span className="bg-brand-charcoal text-brand-gold flex size-9 items-center justify-center rounded-full text-xs font-bold">
              {initials}
            </span>
            <span className="hidden text-sm sm:block">
              <span className="block font-semibold">{me?.full_name}</span>
              {me && <span className="text-brand-ink/70 block text-xs">{roleNames[me.role]}</span>}
            </span>
          </div>
        </header>
        <main id="main" tabIndex={-1} className="px-4 py-6 outline-none sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
