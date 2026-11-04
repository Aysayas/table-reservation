export function flyToCart(from: Element) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const to = [...document.querySelectorAll('[data-cart-target]')]
    .filter((el) => el.getClientRects().length)
    .at(-1)
  if (!to) return
  const a = from.getBoundingClientRect()
  const b = to.getBoundingClientRect()
  const dx = b.left + b.width / 2 - (a.left + a.width / 2)
  const dy = b.top + b.height / 2 - (a.top + a.height / 2)
  const dot = document.createElement('span')
  dot.setAttribute('aria-hidden', 'true')
  dot.className = 'bg-brand-gold pointer-events-none fixed z-50 size-3 rounded-full'
  dot.style.left = `${a.left + a.width / 2 - 6}px`
  dot.style.top = `${a.top + a.height / 2 - 6}px`
  document.body.append(dot)
  dot
    .animate(
      [
        { transform: 'none' },
        { transform: `translate(${dx / 2}px, ${dy / 2 - 48}px) scale(1.2)`, offset: 0.5 },
        { transform: `translate(${dx}px, ${dy}px) scale(0.4)`, opacity: 0.6 },
      ],
      { duration: 550, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    )
    .finished.catch(() => undefined)
    .finally(() => dot.remove())
}
