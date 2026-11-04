import { Link } from 'react-router-dom'
import Ornament from '@/components/Ornament'

export default function ErrorPage() {
  return (
    <main className="bg-brand-cream flex min-h-dvh items-center justify-center px-4 py-16">
      <div className="gold-corners shadow-soft w-full max-w-md rounded-lg bg-white p-8 text-center">
        <h1 className="text-brand-charcoal font-serif text-3xl">Something went wrong</h1>
        <Ornament className="mx-auto mt-3 w-24" />
        <p className="text-brand-ink/75 mt-4 text-sm">
          This page hit a problem. Try again, or go back to the home page.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="bg-brand-red hover:bg-brand-red/90 lift tracking-label rounded-sm py-3 text-xs font-bold text-white uppercase transition-colors duration-200"
          >
            Try Again
          </button>
          <Link
            to="/"
            className="border-brand-charcoal text-brand-charcoal hover:bg-brand-charcoal tracking-label rounded-sm border py-3 text-xs font-bold uppercase transition-colors duration-200 hover:text-white"
          >
            Go Home
          </Link>
        </div>
      </div>
    </main>
  )
}
