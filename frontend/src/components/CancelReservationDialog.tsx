import Modal from '@/components/Modal'
import Spinner from '@/components/Spinner'
import type { PublicReservation } from '@/types/db'

const peso = (amount: number) =>
  `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

type Props = {
  reservation: PublicReservation
  busy: boolean
  onKeep: () => void
  onCancel: () => void
}

export default function CancelReservationDialog({ reservation, busy, onKeep, onCancel }: Props) {
  return (
    <Modal
      title={`Cancel ${reservation.reference_code}?`}
      onClose={onKeep}
      framed
      dismissible={!busy}
    >
      <p className="text-brand-ink/75 text-center text-sm">
        {reservation.deposit_status === 'paid' && reservation.deposit_amount > 0
          ? `Your ${peso(reservation.deposit_amount)} deposit is non-refundable. This can't be undone.`
          : "This can't be undone."}
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          autoFocus
          disabled={busy}
          onClick={onKeep}
          className="border-brand-charcoal text-brand-charcoal hover:bg-brand-charcoal rounded-sm border px-3 py-3 text-xs font-bold tracking-[0.1em] uppercase transition-colors duration-200 hover:text-white disabled:opacity-60"
        >
          Keep Reservation
        </button>
        <button
          type="button"
          disabled={busy}
          aria-busy={busy}
          onClick={onCancel}
          className="bg-brand-red hover:bg-brand-red/90 inline-flex items-center justify-center gap-2 rounded-sm px-3 py-3 text-xs font-bold tracking-[0.1em] text-white uppercase transition-colors duration-200 disabled:opacity-60"
        >
          {busy && <Spinner />}
          Cancel Reservation
        </button>
      </div>
    </Modal>
  )
}
