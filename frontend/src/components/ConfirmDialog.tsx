import Modal from '@/components/Modal'
import Spinner from '@/components/Spinner'

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
    <Modal title={title} onClose={onClose} framed dismissible={!busy}>
      <p className="text-brand-ink/70 text-center text-sm">{body}</p>
      <div className="mt-6 flex justify-center gap-3">
        <button
          type="button"
          autoFocus
          disabled={busy}
          onClick={onClose}
          className="border-brand-line text-brand-charcoal rounded-md border px-4 py-2 text-sm font-bold disabled:opacity-50"
        >
          {closeLabel}
        </button>
        <button
          type="button"
          disabled={busy}
          aria-busy={busy}
          onClick={onConfirm}
          className="bg-brand-red hover:bg-brand-red/90 inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {busy && <Spinner />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
