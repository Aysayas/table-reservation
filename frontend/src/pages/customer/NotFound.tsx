import { Link } from 'react-router-dom'

export default function NotFound({ home = '/' }: { home?: string }) {
  return (
    <div className="bg-brand-cream min-h-[calc(100dvh-4rem)] px-4 py-16 text-center md:py-24">
      <div className="md:mx-auto md:max-w-md">
        <h1 className="text-brand-charcoal font-serif text-4xl leading-tight">Page not found</h1>
        <p className="text-brand-ink/75 mt-3 text-sm">
          We couldn't find that page. It may have moved, or the link may be wrong.
        </p>
        <Link
          to={home}
          className="bg-brand-red hover:bg-brand-red/90 focus-visible:outline-brand-gold tracking-label mt-8 block w-full rounded-sm py-4 text-center text-sm font-bold text-white uppercase transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {home === '/' ? 'Back to Home' : 'Back to Dashboard'}
        </Link>
      </div>
    </div>
  )
}
