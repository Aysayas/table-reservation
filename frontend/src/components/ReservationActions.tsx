import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { toast } from 'sonner'
import ConfirmDialog from '@/components/ConfirmDialog'
import { formatTime } from '@/lib/hours'
import { reservationStatuses } from '@/lib/reservationStatus'
import { updateReservationStatus } from '@/services/reservations'
import { getTables } from '@/services/tables'
import type { PublicReservation, ReservationStatus } from '@/types/db'

const action =
  'border-brand-charcoal text-brand-charcoal hover:bg-brand-charcoal rounded-md border px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors duration-200 hover:text-white'

export default function ReservationActions({
  reservation: r,
  children,
}: {
  reservation: PublicReservation
  children?: ReactNode
}) {
  const queryClient = useQueryClient()
  const [assigning, setAssigning] = useState(false)
  const [confirming, setConfirming] = useState<'no_show' | 'cancelled' | null>(null)
  const { data: tables = [] } = useQuery({
    queryKey: ['tables'],
    queryFn: () => getTables(),
    enabled: assigning,
  })
  const change = useMutation({
    mutationFn: (args: { status?: ReservationStatus; table_id?: number }) =>
      updateReservationStatus(r.reservation_id, args),
    onSuccess: (updated) => {
      toast.success(
        `${updated.reference_code} is now ${reservationStatuses[updated.status].text.toLowerCase()}`,
      )
      setAssigning(false)
      setConfirming(null)
      for (const key of ['reservations', 'tables', 'dashboard']) {
        queryClient.invalidateQueries({ queryKey: [key] })
      }
    },
    onError: (e) => toast.error(e.message),
  })
  const seats = tables.filter((t) => t.capacity >= r.pax && t.table_number !== r.table_number)
  const cancel = (
    <button
      type="button"
      aria-label={`Cancel ${r.reference_code}`}
      onClick={() => setConfirming('cancelled')}
      className={action}
    >
      Cancel
    </button>
  )

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {children}
        {r.status === 'confirmed' && (
          <>
            <button
              type="button"
              aria-label={`Mark ${r.reference_code} arrived`}
              onClick={() => change.mutate({ status: 'arrived' })}
              className={action}
            >
              Arrived
            </button>
            <button
              type="button"
              aria-label={`Mark ${r.reference_code} no-show`}
              onClick={() => setConfirming('no_show')}
              className={action}
            >
              No-show
            </button>
            <button
              type="button"
              aria-label={`Change the table for ${r.reference_code}`}
              onClick={() => setAssigning(true)}
              className={action}
            >
              Change Table
            </button>
            {cancel}
          </>
        )}
        {r.status === 'pending' && (
          <>
            <button
              type="button"
              aria-label={`Assign a table to ${r.reference_code}`}
              onClick={() => setAssigning(true)}
              className={action}
            >
              Assign Table
            </button>
            {cancel}
          </>
        )}
        {r.status === 'no_show' && (
          <button
            type="button"
            aria-label={`Undo no-show for ${r.reference_code}`}
            disabled={change.isPending}
            onClick={() => change.mutate({ status: 'confirmed' })}
            className={action}
          >
            Undo No-show
          </button>
        )}
      </div>

      {confirming && (
        <ConfirmDialog
          title={
            confirming === 'cancelled'
              ? `Cancel ${r.reference_code}?`
              : `Mark ${r.reference_code} as a no-show?`
          }
          body={
            confirming === 'cancelled'
              ? `${r.customer.full_name}'s booking will be cancelled and this can't be undone.${r.deposit_status === 'paid' ? ' The deposit is non-refundable.' : ''}`
              : `This frees the table. If ${r.customer.full_name} comes later, use Undo No-show.`
          }
          confirmLabel={confirming === 'cancelled' ? 'Cancel Reservation' : 'Mark No-show'}
          closeLabel={confirming === 'cancelled' ? 'Keep Reservation' : 'Go Back'}
          busy={change.isPending}
          onConfirm={() => change.mutate({ status: confirming })}
          onClose={() => setConfirming(null)}
        />
      )}

      {assigning && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4 whitespace-normal">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`assign-title-${r.reservation_id}`}
            className="w-full max-w-md rounded-lg bg-white p-6 text-left shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <h2
                id={`assign-title-${r.reservation_id}`}
                className="text-brand-charcoal font-serif text-2xl font-bold"
              >
                Assign a table
              </h2>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setAssigning(false)}
                className="text-brand-ink/60 hover:text-brand-charcoal"
              >
                <X className="size-5" />
              </button>
            </div>
            <p className="text-brand-ink/75 mt-2 text-sm">
              {r.reference_code} · {r.customer.full_name} · {r.pax}{' '}
              {r.pax === 1 ? 'guest' : 'guests'} at {formatTime(r.reservation_time)}
            </p>
            {tables.length > 0 && seats.length === 0 && (
              <p className="text-brand-red mt-5 text-sm">
                No other table seats {r.pax} guests. Add one under Tables and QR Codes.
              </p>
            )}
            <ul className="mt-5 grid grid-cols-4 gap-2">
              {seats.map((t) => (
                <li key={t.table_id}>
                  <button
                    type="button"
                    disabled={change.isPending}
                    onClick={() => change.mutate({ table_id: t.table_id })}
                    className="border-brand-line hover:border-brand-red w-full rounded-md border px-2 py-3 text-center transition-colors duration-200"
                  >
                    <span className="text-brand-charcoal block text-sm font-bold">
                      {t.table_number}
                    </span>
                    <span className="text-brand-ink/60 block text-xs">{t.capacity} seats</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  )
}
