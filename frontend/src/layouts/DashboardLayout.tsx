import { NavLink, Outlet } from 'react-router-dom'

export type NavItem = {
  to: string
  label: string
}

type Props = {
  title: string
  items: NavItem[]
}

export default function DashboardLayout({ title, items }: Props) {
  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 flex-col border-r border-neutral-200 p-4">
        <p className="mb-6 font-semibold">{title}</p>
        <nav className="flex flex-1 flex-col gap-1">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                `rounded px-3 py-2 text-sm ${isActive ? 'bg-black text-white' : 'hover:bg-neutral-100'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <NavLink to="/staff/login" className="px-3 py-2 text-sm hover:bg-neutral-100">
          Log Out
        </NavLink>
      </aside>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
