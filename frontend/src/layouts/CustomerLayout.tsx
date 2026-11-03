import { useQuery } from '@tanstack/react-query'
import { Menu as MenuIcon, ShoppingCart, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import AccountMenu from '@/components/AccountMenu'
import useAccount from '@/hooks/useAccount'
import { logoutAccount } from '@/services/account'
import { getSettings } from '@/services/settings'
import { getTable } from '@/services/tables'
import { cartCount, useCart } from '@/stores/cart'

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
const loggedOutKey = 'logged-out'

export default function CustomerLayout() {
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: getSettings })
  const [open, setOpen] = useState(false)
  const toggle = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLElement>(null)
  const { pathname } = useLocation()
  const wide = !pathname.startsWith('/table')
  const { data: account } = useAccount()
  const logOut = async () => {
    setOpen(false)
    await logoutAccount()
    try {
      sessionStorage.setItem(loggedOutKey, '1')
    } catch {
      window.location.assign('/')
      return
    }
    window.location.assign('/')
  }
  useEffect(() => {
    try {
      if (sessionStorage.getItem(loggedOutKey)) {
        sessionStorage.removeItem(loggedOutKey)
        toast.success("You're logged out")
      }
    } catch {
      return
    }
  }, [])
  useEffect(() => {
    if (!open) return
    panel.current?.querySelector('a')?.focus()
    const closeOutside = (event: PointerEvent) => {
      const target = event.target as Node
      if (!panel.current?.contains(target) && !toggle.current?.contains(target)) setOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      toggle.current?.focus()
    }
    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])
  const words = settings?.restaurant_name.split(' ') ?? []
  const lastWord = words.pop()
  const siteLinks = account ? customerLinks.slice(0, 3) : customerLinks
  const tableId = Number(pathname.match(/^\/table\/(\d+)/)?.[1]) || null
  const panelLinks = wide
    ? siteLinks
    : tableLinks.map((link) =>
        link.to === '/menu' && tableId ? { ...link, to: `/table/${tableId}/menu` } : link,
      )
  const { data: table } = useQuery({
    queryKey: ['table', tableId],
    queryFn: () => getTable(tableId ?? 0),
    enabled: tableId !== null,
  })
  const cartTable = useCart((s) => s.tableId)
  const lines = useCart((s) => s.lines)
  const count = cartTable === tableId ? cartCount(lines) : 0

  return (
    <div
      className={`mx-auto min-h-dvh max-w-[390px] border-x border-neutral-200 ${wide ? 'sm:max-w-none sm:border-x-0' : ''}`}
    >
      <a
        href="#main"
        className="focus:bg-brand-gold focus:text-brand-charcoal sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-sm focus:px-4 focus:py-2 focus:text-sm focus:font-bold"
      >
        Skip to content
      </a>
      <header
        className={`bg-brand-charcoal relative flex items-center justify-between gap-2 border-b border-white/10 px-3 py-3 min-[380px]:px-4 ${wide ? 'md:px-[max(2.5rem,calc((100%_-_72rem)/2_+_2.5rem))] md:py-4' : ''}`}
      >
        <Link
          to="/"
          aria-label={settings?.restaurant_name}
          className="flex min-w-0 items-center gap-2"
          onClick={() => setOpen(false)}
        >
          <span
            className={`size-8 shrink-0 overflow-hidden rounded-full ${wide ? 'md:size-10' : ''}`}
          >
            <img
              src={settings?.logo_url ?? '/logo.png'}
              alt=""
              className="size-full scale-[2.2] object-cover object-top"
            />
          </span>
          <span
            className={`flex min-w-0 items-baseline gap-1.5 overflow-x-clip whitespace-nowrap ${account ? (wide ? 'max-[379px]:hidden' : 'hidden') : ''}`}
          >
            <span className={`font-serif text-lg font-bold text-white ${wide ? 'md:text-xl' : ''}`}>
              {words.join(' ')}
            </span>
            <span className={`font-display text-brand-gold text-2xl ${wide ? 'md:text-3xl' : ''}`}>
              {lastWord}
            </span>
          </span>
        </Link>
        <div
          className={`flex shrink-0 items-center gap-2 ${account ? 'max-[419px]:gap-0' : 'max-[379px]:gap-0.5'} ${wide ? 'xl:gap-8' : ''}`}
        >
          {wide && (
            <nav aria-label="Main" className="text-brand-cream hidden items-center gap-8 xl:flex">
              {siteLinks.map((link) => (
                <NavLink key={link.to} to={link.to} end className={wideNavLink}>
                  {link.label}
                </NavLink>
              ))}
              {!account && (
                <NavLink to="/login" className={wideNavLink}>
                  Log In
                </NavLink>
              )}
            </nav>
          )}
          {tableId ? (
            <>
              {table && (
                <span className="bg-brand-gold text-brand-charcoal rounded-full px-3 py-1 text-xs font-bold">
                  Table {table.table_number}
                </span>
              )}
              <Link
                to={`/table/${tableId}/cart`}
                aria-label={`Cart, ${count} ${count === 1 ? 'item' : 'items'}`}
                className="text-brand-cream hover:text-brand-gold relative flex size-11 items-center justify-center transition-colors duration-200"
              >
                <ShoppingCart className="size-5" />
                {count > 0 && (
                  <span className="bg-brand-red absolute -top-0.5 -right-0.5 flex size-4.5 items-center justify-center rounded-full text-[10px] font-bold text-white">
                    {count}
                  </span>
                )}
              </Link>
            </>
          ) : (
            <Link
              to="/reserve"
              onClick={() => setOpen(false)}
              className={`bg-brand-red hover:bg-brand-red/90 flex min-h-11 items-center rounded-md px-3 text-xs font-bold tracking-[0.12em] text-white uppercase transition-colors duration-200 ${account ? 'max-[419px]:px-2' : ''} ${wide ? 'md:px-5' : ''}`}
            >
              <span>
                Reserve
                {wide && <span className="hidden xl:inline"> a Table</span>}
              </span>
            </Link>
          )}
          {account && (
            <AccountMenu
              account={account}
              showName={wide}
              onOpen={() => setOpen(false)}
              onLogOut={logOut}
            />
          )}
          <button
            ref={toggle}
            type="button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            className={`text-brand-cream hover:text-brand-gold flex size-11 items-center justify-center rounded-md border border-white/20 transition-colors duration-200 ${wide ? 'xl:hidden' : ''}`}
          >
            {open ? <X className="size-5" /> : <MenuIcon className="size-5" />}
          </button>
        </div>
        {open && (
          <nav
            ref={panel}
            className={`bg-brand-charcoal text-brand-cream absolute inset-x-0 top-full z-20 border-t border-white/10 shadow-lg motion-safe:transition-[opacity,translate] motion-safe:duration-180 motion-safe:ease-out starting:-translate-y-2 starting:opacity-0 ${wide ? 'xl:hidden' : ''}`}
          >
            {panelLinks.map((link) => (
              <Link key={link.to} to={link.to} className={navLink} onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            ))}
            {wide && !account && (
              <Link to="/login" className={navLink} onClick={() => setOpen(false)}>
                Log In
              </Link>
            )}
          </nav>
        )}
      </header>
      {!wide && (
        <div aria-hidden="true" className="bg-brand-cream fixed inset-0 -z-10 print:hidden" />
      )}
      <main id="main" tabIndex={-1} className="outline-none">
        <Outlet />
      </main>
    </div>
  )
}
