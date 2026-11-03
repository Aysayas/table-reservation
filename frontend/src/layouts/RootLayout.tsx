import { useEffect } from 'react'
import { Outlet, ScrollRestoration, useMatches } from 'react-router-dom'
import OfflineBanner from '@/components/OfflineBanner'

export default function RootLayout() {
  const tab = useMatches()
    .map((m) => (m.handle as { tab?: string } | undefined)?.tab)
    .findLast(Boolean)

  useEffect(() => {
    document.title = tab ? `${tab} · Vencio's Garden` : "Vencio's Garden"
  }, [tab])

  return (
    <>
      <OfflineBanner />
      <Outlet />
      <ScrollRestoration />
    </>
  )
}
