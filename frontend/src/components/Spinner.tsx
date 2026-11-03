export default function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block size-3.5 shrink-0 rounded-full border-2 border-current border-t-transparent align-[-2px] motion-safe:animate-spin ${className}`}
    />
  )
}
