import { useQuery } from '@tanstack/react-query'
import { ChevronDown, LogOut } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useMatches } from 'react-router-dom'
import { getMe } from '@/services/auth'
import { getSettings } from '@/services/settings'
import type { UserRole } from '@/types/db'

export type NavItem = {
  to: string
  label: string
  title?: string
}

type Props = {
  title: string
  items: NavItem[]
}

export default function DashboardLayout({ title, items }: Props) {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const role = title.toLowerCase() as UserRole
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: getSettings })
  const { data: me } = useQuery({ queryKey: ['me', role], queryFn: () => getMe(role) })
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

  return (
    <div className="bg-brand-cream flex min-h-screen print:bg-white">
      <aside className="bg-brand-charcoal sticky top-0 flex h-screen w-60 shrink-0 flex-col px-4 py-6 text-white print:hidden">
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
        <p className="text-brand-gold mt-2 px-2 text-[10px] font-bold tracking-[0.3em] uppercase">
          {title}
        </p>
        <nav aria-label={`${title} menu`} className="mt-8 flex flex-1 flex-col gap-1">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to.split('/').length === 2}
              className={({ isActive }) =>
                `rounded-md px-3 py-2.5 text-sm font-semibold transition-colors duration-200 ${isActive ? 'bg-brand-red text-white' : 'text-white/75 hover:bg-white/10 hover:text-white'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <Link
          to="/staff/login"
          className="flex items-center gap-2 border-t border-white/10 px-3 pt-4 text-sm text-white/75 transition-colors duration-200 hover:text-white"
        >
          <LogOut className="size-4" />
          Log Out
        </Link>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="border-brand-line flex items-center justify-between border-b bg-white px-8 py-4 print:hidden">
          <h1 className="text-brand-charcoal font-serif text-3xl font-bold">
            {pageTitle ?? current?.title ?? current?.label}
          </h1>
          <div className="relative">
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpen(!open)}
              className="text-brand-charcoal hover:bg-brand-cream flex items-center gap-3 rounded-full py-1 pr-2 pl-1 transition-colors duration-200"
            >
              <span className="bg-brand-charcoal text-brand-gold flex size-9 items-center justify-center rounded-full text-xs font-bold">
                {initials}
              </span>
              <span className="text-sm font-semibold">{me?.full_name}</span>
              <ChevronDown className="size-4" />
            </button>
            {open && (
              <div className="border-brand-line absolute right-0 z-10 mt-2 w-44 rounded-lg border bg-white py-1 shadow-lg">
                <Link
                  to="/staff/login"
                  className="text-brand-charcoal hover:bg-brand-cream flex items-center gap-2 px-4 py-2 text-sm"
                >
                  <LogOut className="size-4" />
                  Log Out
                </Link>
              </div>
            )}
          </div>
        </header>
        <main className="px-8 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
