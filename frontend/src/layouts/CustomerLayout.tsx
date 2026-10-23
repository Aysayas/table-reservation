import { useQuery } from '@tanstack/react-query'
import { Link, Outlet } from 'react-router-dom'
import { getSettings } from '@/services/settings'

const navLink = 'hover:text-brand-gold transition-colors duration-200'

export default function CustomerLayout() {
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: getSettings })

  return (
    <div className="mx-auto min-h-screen max-w-[390px] border-x border-neutral-200">
      <header className="bg-brand-charcoal flex items-center justify-between gap-2 border-b border-white/10 px-3 py-3 min-[380px]:px-4">
        <Link to="/" className="flex shrink-0 items-center gap-1.5">
          <img src={settings?.logo_url ?? '/logo.png'} alt="" className="size-8 rounded-full" />
          <span className="text-brand-cream text-sm font-semibold whitespace-nowrap">
            {settings?.restaurant_name}
          </span>
        </Link>
        <nav className="text-brand-cream flex shrink-0 items-center gap-2 text-xs font-medium min-[380px]:gap-3">
          <Link to="/menu" className={navLink}>
            Menu
          </Link>
          <Link to="/about" className={navLink}>
            About
          </Link>
          <Link
            to="/reserve"
            className="bg-brand-gold text-brand-charcoal hover:bg-brand-gold/85 rounded-full px-2 py-1.5 font-semibold transition-colors duration-200 min-[380px]:px-3"
          >
            Reserve
          </Link>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
