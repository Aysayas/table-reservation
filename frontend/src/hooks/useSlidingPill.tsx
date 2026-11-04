import { useLayoutEffect, useRef, useState } from 'react'

type Box = { x: number; y: number; w: number; h: number; moved: boolean }

export default function useSlidingPill<T extends HTMLElement = HTMLDivElement>(
  watch: unknown,
  shape = 'rounded-full',
) {
  const ref = useRef<T>(null)
  const [box, setBox] = useState<Box>()

  useLayoutEffect(() => {
    const group = ref.current
    if (!group) {
      setBox(undefined)
      return
    }
    const place = () => {
      const on = group.querySelector<HTMLElement>('[aria-pressed="true"]')
      setBox((old) =>
        on
          ? {
              x: on.offsetLeft,
              y: on.offsetTop,
              w: on.offsetWidth,
              h: on.offsetHeight,
              moved: !!old,
            }
          : undefined,
      )
    }
    place()
    const observer = new ResizeObserver(place)
    observer.observe(group)
    return () => observer.disconnect()
  }, [watch])

  const pill = box ? (
    <span
      aria-hidden="true"
      style={{ width: box.w, height: box.h, translate: `${box.x}px ${box.y}px` }}
      className={`bg-brand-charcoal pointer-events-none absolute top-0 left-0 z-[5] motion-reduce:hidden ${shape} ${box.moved ? 'transition-[translate,width,height] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]' : ''}`}
    />
  ) : null

  return [ref, pill, !!box] as const
}
