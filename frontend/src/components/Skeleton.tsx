export default function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`bg-brand-line/40 rounded-md motion-safe:animate-pulse ${className}`}
    />
  )
}
