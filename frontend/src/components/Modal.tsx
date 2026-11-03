import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import Ornament from '@/components/Ornament'

type Props = {
  title: ReactNode
  onClose: () => void
  children: ReactNode
  framed?: boolean
  className?: string
}

export default function Modal({
  title,
  onClose,
  children,
  framed = false,
  className = 'max-w-md',
}: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
    return () => dialog?.close()
  }, [])

  const requestClose = () => {
    if (closing) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) onClose()
    else setClosing(true)
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        requestClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) requestClose()
      }}
      onAnimationEnd={() => {
        if (closing) onClose()
      }}
      data-closing={closing || undefined}
      className={`backdrop:bg-brand-charcoal/50 m-auto w-[calc(100%-2rem)] rounded-lg bg-white p-0 shadow-xl data-closing:animate-[dialog-out_150ms_ease-in_forwards] ${className}`}
    >
      <div className={`p-6 ${framed ? 'gold-corners' : ''}`}>
        <h2 id={titleId} className="text-brand-charcoal text-center font-serif text-2xl">
          {title}
        </h2>
        <Ornament className="mx-auto mt-2 mb-5 w-24" />
        {children}
      </div>
    </dialog>
  )
}
