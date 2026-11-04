export default function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`bg-brand-line/40 rounded-lg motion-safe:animate-pulse ${className}`}
    />
  )
}
