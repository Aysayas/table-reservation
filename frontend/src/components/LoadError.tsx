export default function LoadError({ what, onRetry }: { what: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="border-brand-line rounded-lg border bg-white p-5 text-center md:p-6"
    >
      <h2 className="text-brand-charcoal font-serif text-2xl">We couldn't load {what}</h2>
      <p className="text-brand-ink/75 mt-3 text-sm">Check your connection, then try again.</p>
      <button
        type="button"
        onClick={onRetry}
        className="border-brand-charcoal text-brand-charcoal hover:bg-brand-charcoal mt-5 rounded-sm border px-5 py-3 text-xs font-bold tracking-[0.1em] uppercase transition-colors duration-200 hover:text-white"
      >
        Try Again
      </button>
    </div>
  )
}
