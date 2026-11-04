import { useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import Ornament from '@/components/Ornament'

type Props = {
  title: ReactNode
  onClose: () => void
  children: ReactNode
  framed?: boolean
  dismissible?: boolean
  className?: string
}

export default function Modal({
  title,
  onClose,
  children,
  framed = false,
  dismissible = true,
  className = 'max-w-md',
}: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const pressStart = useRef<EventTarget | null>(null)
  const titleId = useId()
  const [closing, setClosing] = useState(false)

  useLayoutEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
    return () => dialog?.close()
  }, [])

  const requestClose = () => {
    if (closing || !dismissible) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) onClose()
    else setClosing(true)
  }

  return createPortal(
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        if (!event.cancelable) return onClose()
        event.preventDefault()
        requestClose()
      }}
      onMouseDown={(event) => {
        pressStart.current = event.target
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && pressStart.current === event.currentTarget)
          requestClose()
      }}
      onAnimationEnd={(event) => {
        if (closing && event.target === event.currentTarget) onClose()
      }}
      data-closing={closing || undefined}
      className={`backdrop:bg-brand-charcoal/50 shadow-lift m-auto w-[calc(100%-2rem)] rounded-lg bg-white p-0 data-closing:animate-[dialog-out_150ms_ease-in_forwards] ${className}`}
    >
      <div className={`p-6 ${framed ? 'gold-corners' : ''}`}>
        <h2 id={titleId} className="text-brand-charcoal text-center font-serif text-2xl">
          {title}
        </h2>
        <Ornament className="mx-auto mt-2 mb-5 w-24" />
        {children}
      </div>
    </dialog>,
    document.body,
  )
}
