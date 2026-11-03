import { WifiOff } from 'lucide-react'
import { useSyncExternalStore } from 'react'

const subscribe = (onChange: () => void) => {
  window.addEventListener('online', onChange)
  window.addEventListener('offline', onChange)
  return () => {
    window.removeEventListener('online', onChange)
    window.removeEventListener('offline', onChange)
  }
}

export default function OfflineBanner() {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine)
  if (online) return null

  return (
    <p
      role="status"
      className="bg-brand-charcoal text-brand-cream border-brand-gold/40 sticky top-0 z-50 flex items-center justify-center gap-2 border-b px-4 py-2.5 text-xs font-semibold print:hidden"
    >
      <WifiOff aria-hidden="true" className="text-brand-gold size-4" />
      You're offline. This page will update when you're back.
    </p>
  )
}
