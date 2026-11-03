import { useEffect, useState } from 'react'

export default function DrawnCheck({ className = '' }: { className?: string }) {
  const [drawn, setDrawn] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setDrawn(true), 150)
    return () => clearTimeout(timer)
  }, [])
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path
        d="M20 6 9 17l-5-5"
        pathLength={1}
        className={`[stroke-dasharray:1] motion-safe:transition-[stroke-dashoffset] motion-safe:duration-700 motion-safe:ease-out ${drawn ? '[stroke-dashoffset:0]' : '[stroke-dashoffset:1]'}`}
      />
    </svg>
  )
}
