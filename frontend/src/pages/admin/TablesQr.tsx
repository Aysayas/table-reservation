import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Printer } from 'lucide-react'
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react'
import { useState } from 'react'
import { flushSync } from 'react-dom'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import LoadError from '@/components/LoadError'
import Modal from '@/components/Modal'
import Skeleton from '@/components/Skeleton'
import Spinner from '@/components/Spinner'
import { getSettings } from '@/services/settings'
import {
  createTable,
  deleteTable,
  getAdminTables,
  setTableActive,
  updateTable,
  type AdminTable,
} from '@/services/tables'

const label = 'text-brand-charcoal block text-sm font-bold'
const field =
  'border-brand-line focus:border-brand-gold mt-2 block w-full rounded-lg border bg-white px-4 py-3 text-sm font-normal outline-none placeholder:text-brand-ink/65'
const error = 'text-brand-red mt-1.5 text-xs'
const outline =
  'border-brand-charcoal text-brand-charcoal hover:bg-brand-charcoal rounded-lg border py-2 text-sm font-bold transition-colors duration-200 hover:text-white'

const schema = z.object({
  table_number: z
    .string()
    .trim()
    .min(1, 'Enter a table number')
    .max(10, 'Use 10 characters or less'),
  capacity: z
    .number({ error: 'Enter the number of seats' })
    .int('Use a whole number')
    .min(1, 'At least 1 seat')
    .max(50, 'At most 50 seats'),
})

type FormValues = z.infer<typeof schema>

const orderLink = (t: AdminTable) => `${window.location.origin}/table/${t.table_id}?t=${t.qr_token}`

export default function TablesQr() {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<AdminTable | 'new' | null>(null)
  const [deleting, setDeleting] = useState<AdminTable | null>(null)
  const [retiring, setRetiring] = useState<AdminTable | null>(null)
  const [printing, setPrinting] = useState<AdminTable[]>([])
  const {
    data: allTables = [],
    isPending,
    isLoadingError,
    refetch,
  } = useQuery({ queryKey: ['tables', 'admin'], queryFn: getAdminTables })
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: getSettings })
  const active = allTables.filter((t) => t.is_active)
  const retired = allTables.filter((t) => !t.is_active)
  const tables = [...active, ...retired]

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values:
      editing && editing !== 'new'
        ? { table_number: editing.table_number, capacity: editing.capacity }
        : { table_number: '', capacity: 4 },
  })

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['tables'] })

  const [saveError, setSaveError] = useState<string | null>(null)
  const closeEdit = () => {
    setEditing(null)
    setSaveError(null)
  }

  const onSubmit = async (values: FormValues) => {
    setSaveError(null)
    try {
      const saved =
        editing && editing !== 'new'
          ? await updateTable(editing.table_id, values)
          : await createTable(values)
      toast.success(`Table ${saved.table_number} saved`)
      setEditing(null)
      refresh()
    } catch (e) {
      setSaveError((e as Error).message)
    }
  }

  const remove = useMutation({
    mutationFn: (t: AdminTable) => deleteTable(t.table_id),
    onSuccess: (_, t) => {
      setDeleting(null)
      toast.success(`Table ${t.table_number} deleted`)
      refresh()
    },
  })
  const closeDelete = () => {
    setDeleting(null)
    remove.reset()
  }

  const activate = useMutation({
    mutationFn: ({ t, on }: { t: AdminTable; on: boolean }) => setTableActive(t.table_id, on),
    onSuccess: (_, { t, on }) => {
      setRetiring(null)
      toast.success(`Table ${t.table_number} ${on ? 'restored' : 'retired'}`)
      refresh()
    },
    onError: (e, { on }) => {
      if (on) toast.error(e.message)
    },
  })
  const closeRetire = () => {
    setRetiring(null)
    activate.reset()
  }

  const download = (t: AdminTable) => {
    const canvas = document.getElementById(`qr-${t.table_id}`) as HTMLCanvasElement | null
    if (!canvas) return
    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = `table-${t.table_number}-qr.png`
    link.click()
  }

  const print = (list: AdminTable[]) => {
    flushSync(() => setPrinting(list))
    window.print()
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <p className="text-brand-ink/70 text-sm">
          {active.length} tables{retired.length > 0 && ` · ${retired.length} retired`}
        </p>
        <button
          type="button"
          onClick={() => print(active)}
          className={`${outline} ml-auto flex items-center gap-2 px-5`}
        >
          <Printer className="size-4" />
          Print All QR
        </button>
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="bg-brand-red hover:bg-brand-red/90 lift flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-bold text-white duration-200"
        >
          <Plus className="size-4" />
          Add Table
        </button>
      </div>

      {isLoadingError ? (
        <div className="mt-6 print:hidden">
          <LoadError what="the tables" onRetry={() => refetch()} />
        </div>
      ) : (
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 print:hidden">
          {isPending &&
            Array.from({ length: 4 }, (_, i) => (
              <li key={i} className="border-brand-line rounded-lg border bg-white p-5">
                <Skeleton className="h-44" />
                <Skeleton className="mt-4 h-6 w-28" />
                <Skeleton className="mt-4 h-9" />
              </li>
            ))}
          {tables.map((t) => (
            <li
              key={t.table_id}
              aria-label={`Table ${t.table_number}`}
              className="border-brand-line rounded-lg border bg-white p-5"
            >
              <div
                className={`bg-brand-cream/60 relative flex justify-center rounded-lg p-4 ${t.is_active ? '' : '[&>svg]:opacity-30'}`}
              >
                {!t.is_active && (
                  <span className="bg-brand-ink/80 tracking-label absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full px-3 py-1 text-xs font-bold text-white uppercase">
                    Retired
                  </span>
                )}
                <QRCodeSVG
                  value={orderLink(t)}
                  size={144}
                  marginSize={2}
                  role="img"
                  aria-label={`QR code for ${orderLink(t)}`}
                  className="bg-white"
                />
                <QRCodeCanvas
                  id={`qr-${t.table_id}`}
                  value={orderLink(t)}
                  size={512}
                  marginSize={2}
                  aria-hidden="true"
                  className="hidden"
                />
              </div>
              <div className="mt-4 flex items-baseline justify-between gap-3">
                <p className="text-brand-charcoal font-serif text-xl font-bold">
                  Table {t.table_number}
                </p>
                <p className="text-brand-ink/70 text-xs">{t.capacity} seats</p>
              </div>
              {t.is_active ? (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    aria-label={`Download Table ${t.table_number} QR`}
                    onClick={() => download(t)}
                    className={outline}
                  >
                    Download
                  </button>
                  <button
                    type="button"
                    aria-label={`Print Table ${t.table_number} QR`}
                    onClick={() => print([t])}
                    className={outline}
                  >
                    Print
                  </button>
                </div>
              ) : (
                <p className="text-brand-ink/70 mt-4 flex min-h-9 items-center justify-center text-sm">
                  QR turned off
                </p>
              )}
              <div className="mt-4 flex justify-between text-sm font-bold">
                <button
                  type="button"
                  aria-label={`Edit Table ${t.table_number}`}
                  onClick={() => setEditing(t)}
                  className="text-brand-charcoal hover:text-brand-red pointer-coarse:min-h-11 pointer-coarse:min-w-11"
                >
                  Edit
                </button>
                <button
                  type="button"
                  aria-label={`${t.is_active ? 'Retire' : 'Restore'} Table ${t.table_number}`}
                  disabled={activate.isPending}
                  onClick={() => (t.is_active ? setRetiring(t) : activate.mutate({ t, on: true }))}
                  className="text-brand-charcoal hover:text-brand-red disabled:opacity-50 pointer-coarse:min-h-11 pointer-coarse:min-w-11"
                >
                  {t.is_active ? 'Retire' : 'Restore'}
                </button>
                <button
                  type="button"
                  aria-label={`Delete Table ${t.table_number}`}
                  onClick={() => setDeleting(t)}
                  className="text-brand-ink/70 hover:text-brand-red pointer-coarse:min-h-11 pointer-coarse:min-w-11"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="hidden print:block">
        {printing.map((t) => (
          <section
            key={t.table_id}
            aria-label={`Printed QR for Table ${t.table_number}`}
            className="flex h-[90vh] break-after-page flex-col items-center justify-center text-center text-black"
          >
            <p className="font-serif text-3xl font-bold">{settings?.restaurant_name}</p>
            <QRCodeSVG value={orderLink(t)} size={320} marginSize={2} className="mt-8" />
            <p className="mt-8 font-serif text-5xl font-bold">Table {t.table_number}</p>
            <p className="mt-3 text-xl">Scan to order</p>
          </section>
        ))}
      </div>

      {editing && (
        <Modal
          title={editing === 'new' ? 'Add Table' : `Edit Table ${editing.table_number}`}
          onClose={closeEdit}
          dismissible={!isSubmitting}
          error={saveError}
          className="max-w-md print:hidden"
        >
          <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label htmlFor="table_number" className={label}>
                Table Number
              </label>
              <input
                id="table_number"
                placeholder="e.g. T9"
                aria-invalid={!!errors.table_number}
                {...register('table_number')}
                className={field}
              />
              {errors.table_number && <p className={error}>{errors.table_number.message}</p>}
            </div>
            <div>
              <label htmlFor="capacity" className={label}>
                Seats
              </label>
              <input
                id="capacity"
                type="number"
                min="1"
                max="50"
                step="1"
                aria-invalid={!!errors.capacity}
                {...register('capacity', { valueAsNumber: true })}
                className={field}
              />
              {errors.capacity && <p className={error}>{errors.capacity.message}</p>}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={closeEdit}
                className="border-brand-line text-brand-charcoal rounded-lg border px-4 py-2 text-sm font-bold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                className="bg-brand-red hover:bg-brand-red/90 lift inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                {isSubmitting && <Spinner />}
                Save Table
              </button>
            </div>
          </form>
        </Modal>
      )}

      {retiring && (
        <Modal
          title={`Retire Table ${retiring.table_number}?`}
          onClose={closeRetire}
          dismissible={!activate.isPending}
          error={activate.error?.message}
          framed
          className="max-w-md print:hidden"
        >
          <p className="text-brand-ink/70 text-center text-sm">
            Its QR code stops working and it&apos;s hidden from staff screens and new bookings. Past
            orders stay in the history. You can restore it anytime.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              disabled={activate.isPending}
              onClick={closeRetire}
              className="border-brand-line text-brand-charcoal rounded-lg border px-4 py-2 text-sm font-bold disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={activate.isPending}
              aria-busy={activate.isPending}
              onClick={() => activate.mutate({ t: retiring, on: false })}
              className="bg-brand-red hover:bg-brand-red/90 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              {activate.isPending && <Spinner />}
              Retire Table
            </button>
          </div>
        </Modal>
      )}

      {deleting && (
        <Modal
          title={`Delete Table ${deleting.table_number}?`}
          onClose={closeDelete}
          dismissible={!remove.isPending}
          error={remove.error?.message}
          framed
          className="max-w-md print:hidden"
        >
          <p className="text-brand-ink/70 text-center text-sm">
            Its QR code will stop working. This can&apos;t be undone.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              disabled={remove.isPending}
              onClick={closeDelete}
              className="border-brand-line text-brand-charcoal rounded-lg border px-4 py-2 text-sm font-bold disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={remove.isPending}
              aria-busy={remove.isPending}
              onClick={() => remove.mutate(deleting)}
              className="bg-brand-red hover:bg-brand-red/90 lift inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              {remove.isPending && <Spinner />}
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
