import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { CustomerAccount } from '@/types/db'

const item =
  'hover:text-brand-gold block w-full border-t border-white/10 px-4 py-3.5 text-left text-sm font-semibold tracking-[0.15em] uppercase transition-colors duration-200'

type Props = {
  account: CustomerAccount
  showName: boolean
  onOpen: () => void
  onLogOut: () => void
}

export default function AccountMenu({ account, showName, onOpen, onLogOut }: Props) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const firstName = account.full_name.split(' ')[0]

  useEffect(() => {
    if (!open) return
    box.current?.querySelector<HTMLElement>('nav a')?.focus()
    const closeOutside = (event: MouseEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      trigger.current?.focus()
    }
    document.addEventListener('mousedown', closeOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  return (
    <div ref={box} className="relative">
      <button
        ref={trigger}
        type="button"
        aria-label={`Account menu, logged in as ${account.full_name}`}
        aria-expanded={open}
        onClick={() => {
          if (!open) onOpen()
          setOpen(!open)
        }}
        className="text-brand-cream hover:text-brand-gold flex items-center justify-center gap-2 transition-colors duration-200"
      >
        <span className="bg-brand-gold text-brand-charcoal flex size-9 items-center justify-center rounded-full text-sm font-bold">
          {firstName.charAt(0).toUpperCase()}
        </span>
        {showName && (
          <span className="hidden text-xs font-semibold tracking-[0.15em] uppercase xl:inline">
            {firstName}
          </span>
        )}
      </button>
      {open && (
        <nav
          aria-label="Account"
          className="bg-brand-charcoal text-brand-cream absolute top-full right-0 z-20 mt-3 w-64 rounded-md border border-white/10 shadow-lg motion-safe:transition-[opacity,translate] motion-safe:duration-180 motion-safe:ease-out starting:-translate-y-2 starting:opacity-0"
        >
          <p className="px-4 py-3 text-sm">
            Logged in as <strong className="text-brand-gold">{account.full_name}</strong>
          </p>
          <Link to="/my-reservations" className={item} onClick={() => setOpen(false)}>
            My Reservations
          </Link>
          <Link to="/profile" className={item} onClick={() => setOpen(false)}>
            Profile
          </Link>
          <button type="button" onClick={onLogOut} className={item}>
            Log Out
          </button>
        </nav>
      )}
    </div>
  )
}
