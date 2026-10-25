import { type ReactNode, useEffect, useRef, useState } from 'react'

export default function Reveal({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`motion-safe:transition motion-safe:duration-700 motion-safe:ease-out ${shown ? '' : 'motion-safe:translate-y-4 motion-safe:opacity-0'} ${className}`}
    >
      {children}
    </div>
  )
}
