import { Link, Outlet } from 'react-router-dom'

export default function CustomerLayout() {
  return (
    <div className="mx-auto min-h-screen max-w-[390px] border-x border-neutral-200">
      <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
        <Link to="/" className="font-semibold">
          Restaurant Name
        </Link>
        <nav className="flex gap-3 text-sm">
          <Link to="/menu">Menu</Link>
          <Link to="/reserve">Reserve</Link>
          <Link to="/about">About</Link>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
