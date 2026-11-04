import { useLayoutEffect, useRef, type RefObject } from 'react'

export default function useSlideOnMove(root: RefObject<HTMLElement | null>) {
  const last = useRef(new Map<string, { left: number; top: number; group: string }>())

  useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const next = new Map<string, { left: number; top: number; group: string }>()
    el.querySelectorAll<HTMLElement>('[data-slide-id]').forEach((node) => {
      const id = node.dataset.slideId ?? ''
      const group = node.dataset.slideGroup ?? ''
      const { left, top } = node.getBoundingClientRect()
      const before = last.current.get(id)
      if (before && before.group !== group && !still) {
        node.animate(
          [
            { transform: `translate(${before.left - left}px, ${before.top - top}px)` },
            { transform: 'none' },
          ],
          { duration: 350, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
        )
      }
      next.set(id, { left, top, group })
    })
    last.current = next
  })
}
