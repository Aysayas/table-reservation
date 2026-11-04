import { useLayoutEffect, useRef, type RefObject } from 'react'

export default function useSlideOnMove(root: RefObject<HTMLElement | null>, order: string[]) {
  const last = useRef(new Map<string, string>())

  useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const next = new Map<string, string>()
    el.querySelectorAll<HTMLElement>('[data-slide-id]').forEach((node) => {
      const id = node.dataset.slideId ?? ''
      const group = node.dataset.slideGroup ?? ''
      const before = last.current.get(id)
      if (before && before !== group && !still) {
        const from = order.indexOf(before) < order.indexOf(group) ? -32 : 32
        node.animate(
          [
            { transform: `translateX(${from}px)`, opacity: 0 },
            { transform: 'none', opacity: 1 },
          ],
          { duration: 350, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
        )
      }
      next.set(id, group)
    })
    last.current = next
  })
}
