type Props = {
  title: string
  body: string
  confirmLabel: string
  closeLabel: string
  busy: boolean
  onConfirm: () => void
  onClose: () => void
}

export default function ConfirmDialog({
  title,
  body,
  confirmLabel,
  closeLabel,
  busy,
  onConfirm,
  onClose,
}: Props) {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onKeyDown={(event) => {
          if (event.key === 'Escape') onClose()
        }}
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
      >
        <h2 id="confirm-title" className="text-brand-charcoal font-serif text-2xl font-bold">
          {title}
        </h2>
        <p className="text-brand-ink/70 mt-2 text-sm">{body}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            autoFocus
            onClick={onClose}
            className="border-brand-line text-brand-charcoal rounded-md border px-4 py-2 text-sm font-bold"
          >
            {closeLabel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="bg-brand-red hover:bg-brand-red/90 rounded-md px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
