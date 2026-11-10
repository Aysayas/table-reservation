import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Plus, Search, UtensilsCrossed } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import EmptyState from '@/components/EmptyState'
import LoadError from '@/components/LoadError'
import Modal from '@/components/Modal'
import Skeleton from '@/components/Skeleton'
import Spinner from '@/components/Spinner'
import { deleteMenuItem, getCategories, getMenuItems, setAvailability } from '@/services/menu'
import type { MenuItem } from '@/types/db'

const perPage = 8
const peso = (amount: number) =>
  `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const th = 'text-brand-ink/70 px-4 py-3 text-left text-xs font-bold tracking-label uppercase'
const td = 'text-brand-charcoal px-4 py-3 text-sm'
const smallButton =
  'pointer-coarse:min-h-11 inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors duration-200'
const dl = 'grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm'
const dt = 'text-brand-ink/70'
const dd = 'text-brand-charcoal text-right'

export default function MenuManagement() {
  const queryClient = useQueryClient()
  const { pathname, search: linkSearch } = useLocation()
  const [params, setParams] = useSearchParams()
  const search = params.get('q') ?? ''
  const categoryId = Number(params.get('category')) || 0
  const page = Number(params.get('page')) || 1
  const update = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    setParams(next, { replace: true })
  }
  const setPage = (value: number) => update({ page: value > 1 ? String(value) : '' })
  const from = { from: `${pathname}${linkSearch}` }
  const [deleting, setDeleting] = useState<MenuItem | null>(null)
  const {
    data: items = [],
    isPending,
    isLoadingError,
    refetch,
  } = useQuery({
    queryKey: ['menu-items'],
    queryFn: () => getMenuItems(),
  })
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: getCategories })
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['menu-items'] })
  const toggle = useMutation({
    mutationFn: (item: MenuItem) => setAvailability(item.item_id, !item.is_available),
    onSuccess: (item) => {
      toast.success(`${item.name} is now ${item.is_available ? 'available' : 'unavailable'}`)
      refresh()
    },
    onError: (e) => toast.error(e.message),
  })
  const remove = useMutation({
    mutationFn: (item: MenuItem) => deleteMenuItem(item.item_id),
    onSuccess: (_, item) => {
      setDeleting(null)
      toast.success(`${item.name} deleted`)
      refresh()
    },
  })
  const closeDelete = () => {
    setDeleting(null)
    remove.reset()
  }

  const term = search.trim().toLowerCase()
  const matches = items.filter(
    (item) =>
      (!categoryId || item.category_id === categoryId) &&
      (!term || item.name.toLowerCase().includes(term)),
  )
  const pages = Math.max(1, Math.ceil(matches.length / perPage))
  const current = Math.min(page, pages)
  const rows = matches.slice((current - 1) * perPage, current * perPage)
  const first = matches.length ? (current - 1) * perPage + 1 : 0
  const categoryName = (id: number) => categories.find((c) => c.category_id === id)?.name ?? ''

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="border-brand-line focus-within:border-brand-gold flex w-full max-w-sm items-center gap-2 rounded-lg border bg-white px-3">
          <Search className="text-brand-ink/70 size-4" />
          <span className="sr-only">Search</span>
          <input
            type="search"
            value={search}
            onChange={(e) => update({ q: e.target.value, page: '' })}
            placeholder="Search"
            className="w-full py-2.5 text-sm outline-none"
          />
        </label>
        <label>
          <span className="sr-only">Category</span>
          <select
            value={categoryId}
            onChange={(e) =>
              update({ category: e.target.value === '0' ? '' : e.target.value, page: '' })
            }
            className="border-brand-line focus:border-brand-gold rounded-lg border bg-white px-3 py-2.5 text-sm outline-none"
          >
            <option value={0}>All Categories</option>
            {categories.map((c) => (
              <option key={c.category_id} value={c.category_id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <Link
          to="/admin/menu/new"
          state={from}
          className="bg-brand-red hover:bg-brand-red/90 lift ml-auto flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold text-white duration-200 pointer-coarse:min-h-11"
        >
          <Plus className="size-4" />
          Add Menu Item
        </Link>
      </div>

      {isLoadingError ? (
        <div className="mt-6">
          <LoadError what="the menu" onRetry={() => refetch()} />
        </div>
      ) : (
        <div className="border-brand-line mt-6 overflow-x-auto rounded-lg border bg-white">
          <ul className="divide-brand-line divide-y md:hidden">
            {rows.map((item) => (
              <li key={item.item_id} className="space-y-3 p-4">
                <div className="flex items-center gap-3">
                  {item.image_url ? (
                    <img src={item.image_url} alt="" className="size-12 rounded-lg object-cover" />
                  ) : (
                    <span className="bg-brand-cream text-brand-gold-deep flex size-12 shrink-0 items-center justify-center rounded-lg">
                      <UtensilsCrossed className="size-5" strokeWidth={1.5} />
                    </span>
                  )}
                  <p className="text-brand-charcoal min-w-0 flex-1 font-semibold">{item.name}</p>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={item.is_available}
                    aria-label={`${item.name} available`}
                    disabled={toggle.isPending}
                    onClick={() => toggle.mutate(item)}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 pointer-coarse:before:absolute pointer-coarse:before:inset-x-0 pointer-coarse:before:-inset-y-2.5 ${item.is_available ? 'bg-brand-green' : 'bg-brand-ink/20'}`}
                  >
                    <span
                      className={`shadow-soft absolute top-0.5 left-0.5 size-5 rounded-full bg-white transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${item.is_available ? 'translate-x-5' : ''}`}
                    />
                  </button>
                </div>
                <dl className={dl}>
                  <dt className={dt}>Category</dt>
                  <dd className={dd}>{categoryName(item.category_id)}</dd>
                  <dt className={dt}>Price</dt>
                  <dd className={`${dd} tabular-nums`}>{peso(item.price)}</dd>
                </dl>
                <div className="flex gap-2 *:flex-1">
                  <Link
                    to={`/admin/menu/${item.item_id}/edit`}
                    state={from}
                    aria-label={`Edit ${item.name}`}
                    className={`${smallButton} border-brand-charcoal text-brand-charcoal hover:bg-brand-charcoal hover:text-white`}
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    aria-label={`Delete ${item.name}`}
                    onClick={() => setDeleting(item)}
                    className={`${smallButton} border-brand-red text-brand-red hover:bg-brand-red hover:text-white`}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
            {isPending &&
              Array.from({ length: 5 }, (_, i) => (
                <li key={i} className="space-y-3 p-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-full" />
                </li>
              ))}
          </ul>
          <table className="hidden w-full md:table">
            <thead className="bg-brand-cream/60">
              <tr>
                {['Image', 'Name', 'Category', 'Price', 'Available', 'Actions'].map((h) => (
                  <th key={h} className={th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.item_id} className="border-brand-line border-t">
                  <td className="px-4 py-2">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt=""
                        className="size-12 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="bg-brand-cream text-brand-gold-deep flex size-12 items-center justify-center rounded-lg">
                        <UtensilsCrossed className="size-5" strokeWidth={1.5} />
                      </span>
                    )}
                  </td>
                  <td className={`${td} font-semibold`}>{item.name}</td>
                  <td className={td}>{categoryName(item.category_id)}</td>
                  <td className={`${td} tabular-nums`}>{peso(item.price)}</td>
                  <td className={td}>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={item.is_available}
                      aria-label={`${item.name} available`}
                      disabled={toggle.isPending}
                      onClick={() => toggle.mutate(item)}
                      className={`relative h-6 w-11 rounded-full transition-colors duration-200 pointer-coarse:before:absolute pointer-coarse:before:inset-x-0 pointer-coarse:before:-inset-y-2.5 ${item.is_available ? 'bg-brand-green' : 'bg-brand-ink/20'}`}
                    >
                      <span
                        className={`shadow-soft absolute top-0.5 left-0.5 size-5 rounded-full bg-white transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${item.is_available ? 'translate-x-5' : ''}`}
                      />
                    </button>
                  </td>
                  <td className={td}>
                    <div className="flex gap-2">
                      <Link
                        to={`/admin/menu/${item.item_id}/edit`}
                        state={from}
                        aria-label={`Edit ${item.name}`}
                        className={`${smallButton} border-brand-charcoal text-brand-charcoal hover:bg-brand-charcoal hover:text-white`}
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        aria-label={`Delete ${item.name}`}
                        onClick={() => setDeleting(item)}
                        className={`${smallButton} border-brand-red text-brand-red hover:bg-brand-red hover:text-white`}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {isPending &&
                Array.from({ length: 5 }, (_, i) => (
                  <tr key={i} className="border-brand-line border-t">
                    {Array.from({ length: 6 }, (_, j) => (
                      <td key={j} className={td}>
                        <Skeleton className="h-4 w-full max-w-28" />
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
          {!isPending && rows.length === 0 && (
            <EmptyState icon={UtensilsCrossed} title="No menu items found." />
          )}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <p className="text-brand-ink/70 text-sm">
          Showing {first}–{Math.min(current * perPage, matches.length)} of {matches.length}
        </p>
        <nav aria-label="Pages" className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            aria-label="Previous page"
            disabled={current <= 1}
            onClick={() => setPage(current - 1)}
            className="border-brand-line flex size-9 items-center justify-center rounded-lg border bg-white disabled:opacity-40 pointer-coarse:size-11"
          >
            <ChevronLeft className="size-4" />
          </button>
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              aria-current={n === current ? 'page' : undefined}
              onClick={() => setPage(n)}
              className={`flex size-9 items-center justify-center rounded-lg border text-sm font-semibold pointer-coarse:size-11 ${n === current ? 'bg-brand-charcoal border-brand-charcoal text-white' : 'border-brand-line bg-white'}`}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            aria-label="Next page"
            disabled={current >= pages}
            onClick={() => setPage(current + 1)}
            className="border-brand-line flex size-9 items-center justify-center rounded-lg border bg-white disabled:opacity-40 pointer-coarse:size-11"
          >
            <ChevronRight className="size-4" />
          </button>
        </nav>
      </div>

      {deleting && (
        <Modal
          title={`Delete ${deleting.name}?`}
          onClose={closeDelete}
          dismissible={!remove.isPending}
          framed
          error={remove.error?.message}
        >
          <p className="text-brand-ink/70 text-center text-sm">
            This removes the dish and its photo. It can&apos;t be undone.
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
