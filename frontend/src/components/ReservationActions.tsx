import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Ellipsis, X } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { toast } from 'sonner'
import ConfirmDialog from '@/components/ConfirmDialog'
import Modal from '@/components/Modal'
import { formatTime } from '@/lib/hours'
import { reservationStatuses } from '@/lib/reservationStatus'
import { removeReservation, updateReservationStatus } from '@/services/reservations'
import { getTables, getTakenTables } from '@/services/tables'
import type { PublicReservation, ReservationStatus } from '@/types/db'

const primary =
  'bg-brand-charcoal hover:bg-brand-charcoal/85 pointer-coarse:min-h-11 rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap text-white transition-colors duration-200'
const more =
  'border-brand-line text-brand-charcoal hover:border-brand-charcoal pointer-coarse:min-h-11 pointer-coarse:min-w-11 flex items-center justify-center rounded-lg border px-2 py-1.5 transition-colors duration-200'
const item =
  'hover:bg-brand-cream focus-visible:bg-brand-cream pointer-coarse:py-3.5 block w-full px-4 py-2.5 text-left text-sm font-semibold outline-none'
type Action = { label: string; aria: string; run: () => void; danger?: boolean }

export default function ReservationActions({
  reservation: r,
  onEdit,
}: {
  reservation: PublicReservation
  onEdit?: () => void
}) {
  const queryClient = useQueryClient()
  const trigger = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const [assigning, setAssigning] = useState(false)
  const [confirming, setConfirming] = useState<'no_show' | 'cancelled' | 'remove' | null>(null)
  const { data: tables = [] } = useQuery({
    queryKey: ['tables'],
    queryFn: () => getTables(),
    enabled: assigning,
  })
  const { data: taken = [] } = useQuery({
    queryKey: ['tables', 'taken', r.reservation_date, r.reservation_time, r.reservation_id],
    queryFn: () => getTakenTables(r.reservation_date, r.reservation_time, r.reservation_id),
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
  const remove = useMutation({
    mutationFn: () => removeReservation(r.reservation_id),
    onSuccess: () => {
      toast.success(`${r.reference_code} removed`)
      setConfirming(null)
      for (const key of ['reservations', 'tables', 'dashboard']) {
        queryClient.invalidateQueries({ queryKey: [key] })
      }
    },
    onError: (e) => toast.error(e.message),
  })
  const removable =
    r.deposit_status === 'unpaid' &&
    r.deposit_amount > 0 &&
    (r.status === 'pending' || r.status === 'confirmed' || r.status === 'cancelled')
  const prompts = {
    cancelled: {
      title: `Cancel ${r.reference_code}?`,
      body: `${r.customer.full_name}'s booking will be cancelled and this can't be undone.${r.deposit_status === 'paid' ? ' The deposit is non-refundable.' : ''}`,
      confirmLabel: 'Cancel Reservation',
      closeLabel: 'Keep Reservation',
    },
    no_show: {
      title: `Mark ${r.reference_code} as a no-show?`,
      body: `This frees the table. If ${r.customer.full_name} comes later, use Undo No-show.`,
      confirmLabel: 'Mark No-show',
      closeLabel: 'Go Back',
    },
    remove: {
      title: `Remove ${r.reference_code}?`,
      body: `${r.customer.full_name}'s unpaid booking will be deleted for good and won't appear in any list.`,
      confirmLabel: 'Remove Booking',
      closeLabel: 'Keep Booking',
    },
  }
  const seats = tables.filter((t) => t.capacity >= r.pax && t.table_number !== r.table_number)
  const allTaken = seats.length > 0 && seats.every((t) => taken.includes(t.table_id))
  const ref = r.reference_code
  const next: Action | null =
    r.status === 'confirmed'
      ? {
          label: 'Arrived',
          aria: `Mark ${ref} arrived`,
          run: () => change.mutate({ status: 'arrived' }),
        }
      : r.status === 'pending'
        ? { label: 'Assign Table', aria: `Assign a table to ${ref}`, run: () => setAssigning(true) }
        : r.status === 'no_show'
          ? {
              label: 'Undo No-show',
              aria: `Undo no-show for ${ref}`,
              run: () => change.mutate({ status: 'confirmed' }),
            }
          : null
  const active = r.status === 'pending' || r.status === 'confirmed'
  const others = [
    r.status === 'confirmed' && {
      label: 'No-show',
      aria: `Mark ${ref} no-show`,
      run: () => setConfirming('no_show'),
    },
    r.status === 'confirmed' && {
      label: 'Change Table',
      aria: `Change the table for ${ref}`,
      run: () => setAssigning(true),
    },
    onEdit && { label: 'Edit', aria: `Edit ${ref}`, run: onEdit },
    active && {
      label: 'Cancel',
      aria: `Cancel ${ref}`,
      run: () => setConfirming('cancelled'),
      danger: true,
    },
    removable && {
      label: 'Remove',
      aria: `Remove ${ref}`,
      run: () => setConfirming('remove'),
      danger: true,
    },
  ].filter((a): a is Action => Boolean(a))

  const placeMenu = () => {
    const box = menu.current
    const anchor = trigger.current?.getBoundingClientRect()
    if (!box || !anchor) return
    const fitsBelow = anchor.bottom + 4 + box.offsetHeight <= window.innerHeight
    box.style.top = `${fitsBelow ? anchor.bottom + 4 : anchor.top - 4 - box.offsetHeight}px`
    box.style.left = `${Math.max(8, anchor.right - box.offsetWidth)}px`
    box.querySelector('button')?.focus()
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {next && (
          <button
            type="button"
            aria-label={next.aria}
            disabled={change.isPending}
            onClick={next.run}
            className={primary}
          >
            {next.label}
          </button>
        )}
        {others.length > 0 && (
          <>
            <button
              ref={trigger}
              type="button"
              popoverTarget={menuId}
              aria-label={`More actions for ${ref}`}
              className={more}
            >
              <Ellipsis aria-hidden="true" className="size-4" />
            </button>
            <div
              ref={menu}
              id={menuId}
              popover="auto"
              onToggle={(event) => {
                if (event.newState === 'open') placeMenu()
              }}
              className="border-brand-line shadow-lift inset-auto m-0 w-44 origin-top-right rounded-lg border bg-white py-1 motion-safe:transition-[opacity,scale] motion-safe:duration-150 motion-safe:ease-out starting:scale-95 starting:opacity-0"
            >
              {others.map((a) => (
                <button
                  key={a.label}
                  type="button"
                  aria-label={a.aria}
                  onClick={() => {
                    menu.current?.hidePopover()
                    trigger.current?.focus()
                    a.run()
                  }}
                  className={`${item} ${a.danger ? 'text-brand-red' : 'text-brand-charcoal'}`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {confirming && (
        <ConfirmDialog
          {...prompts[confirming]}
          busy={change.isPending || remove.isPending}
          onConfirm={() =>
            confirming === 'remove' ? remove.mutate() : change.mutate({ status: confirming })
          }
          onClose={() => setConfirming(null)}
        />
      )}

      {assigning && (
        <Modal
          title="Assign a table"
          onClose={() => setAssigning(false)}
          className="max-w-md text-left whitespace-normal"
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => setAssigning(false)}
            className="text-brand-ink/70 hover:text-brand-charcoal absolute top-4 right-4"
          >
            <X className="size-5" />
          </button>
          <p className="text-brand-ink/75 text-center text-sm">
            {r.reference_code} · {r.customer.full_name} · {r.pax} {r.pax === 1 ? 'guest' : 'guests'}{' '}
            at {formatTime(r.reservation_time)}
          </p>
          {tables.length > 0 && seats.length === 0 && (
            <p className="text-brand-red mt-5 text-sm">
              No other table seats {r.pax} guests. Add one under Tables and QR Codes.
            </p>
          )}
          {allTaken && (
            <p className="text-brand-red mt-5 text-sm">
              Every table that fits is booked at this time.
            </p>
          )}
          <ul className="mt-5 grid grid-cols-4 gap-2">
            {seats.map((t) => {
              const isTaken = taken.includes(t.table_id)
              return (
                <li key={t.table_id}>
                  <button
                    type="button"
                    disabled={change.isPending || isTaken}
                    onClick={() => change.mutate({ table_id: t.table_id })}
                    className="border-brand-line hover:border-brand-red disabled:hover:border-brand-line disabled:bg-brand-line/30 w-full rounded-lg border px-2 py-3 text-center transition-colors duration-200 disabled:cursor-not-allowed"
                  >
                    <span className="text-brand-charcoal block text-sm font-bold">
                      {t.table_number}
                    </span>
                    <span className="text-brand-ink/70 block text-xs">
                      {isTaken ? 'Booked' : `${t.capacity} seats`}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </Modal>
      )}
    </>
  )
}
