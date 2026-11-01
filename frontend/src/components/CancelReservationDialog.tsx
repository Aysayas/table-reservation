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
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-title"
        onKeyDown={(event) => {
          if (event.key === 'Escape') onKeep()
        }}
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
      >
        <h2 id="cancel-title" className="text-brand-charcoal font-serif text-2xl font-bold">
          Cancel {reservation.reference_code}?
        </h2>
        <p className="text-brand-ink/75 mt-2 text-sm">
          {reservation.deposit_status === 'paid' && reservation.deposit_amount > 0
            ? `Your ${peso(reservation.deposit_amount)} deposit is non-refundable. This can't be undone.`
            : "This can't be undone."}
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            autoFocus
            onClick={onKeep}
            className="border-brand-charcoal text-brand-charcoal hover:bg-brand-charcoal rounded-sm border px-3 py-3 text-xs font-bold tracking-[0.1em] uppercase transition-colors duration-200 hover:text-white"
          >
            Keep Reservation
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="bg-brand-red hover:bg-brand-red/90 rounded-sm px-3 py-3 text-xs font-bold tracking-[0.1em] text-white uppercase transition-colors duration-200 disabled:opacity-60"
          >
            Cancel Reservation
          </button>
        </div>
      </div>
    </div>
  )
}
