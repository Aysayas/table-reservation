import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { CircleAlert, CircleCheck, Bell } from 'lucide-react'
import { Toaster } from 'sonner'
import { queryClient } from '@/lib/queryClient'
import { router } from '@/router'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster
        position="top-center"
        className="print:hidden"
        icons={{
          success: <CircleCheck className="text-brand-gold size-5" />,
          error: <CircleAlert className="text-brand-red size-5" />,
          info: <Bell className="text-brand-gold size-5" />,
        }}
        toastOptions={{
          unstyled: true,
          classNames: {
            toast:
              'bg-brand-charcoal border-brand-gold flex w-[min(100vw-2rem,22rem)] items-start gap-3 rounded-lg border-l-4 px-4 py-3 font-sans text-sm text-white shadow-lift',
            error: 'bg-white! text-brand-ink! border-brand-red!',
            title: 'font-bold',
            description: 'mt-0.5 text-xs opacity-80',
            icon: 'mt-0.5 shrink-0',
            actionButton:
              'text-brand-gold ml-auto shrink-0 self-center text-xs font-bold tracking-label uppercase',
          },
        }}
      />
    </QueryClientProvider>
  </StrictMode>,
)
