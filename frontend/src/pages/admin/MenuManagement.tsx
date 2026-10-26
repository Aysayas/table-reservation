import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Plus, Search, UtensilsCrossed } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { deleteMenuItem, getCategories, getMenuItems, setAvailability } from '@/services/menu'
import type { MenuItem } from '@/types/db'

const perPage = 8
const peso = (amount: number) =>
  `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const th = 'text-brand-ink/70 px-4 py-3 text-left text-xs font-bold tracking-[0.1em] uppercase'
const td = 'text-brand-charcoal px-4 py-3 text-sm'
const smallButton = 'rounded-md border px-3 py-1.5 text-xs font-bold transition-colors duration-200'

export default function MenuManagement() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState(0)
  const [page, setPage] = useState(1)
  const [deleting, setDeleting] = useState<MenuItem | null>(null)
  const { data: items = [] } = useQuery({
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
      toast.success(`${item.name} deleted`)
      refresh()
    },
    onError: (e) => toast.error(e.message),
    onSettled: () => setDeleting(null),
  })

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
        <label className="border-brand-line focus-within:border-brand-gold flex w-full max-w-sm items-center gap-2 rounded-md border bg-white px-3">
          <Search className="text-brand-ink/50 size-4" />
          <span className="sr-only">Search</span>
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search"
            className="w-full py-2.5 text-sm outline-none"
          />
        </label>
        <label>
          <span className="sr-only">Category</span>
          <select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(Number(e.target.value))
              setPage(1)
            }}
            className="border-brand-line focus:border-brand-gold rounded-md border bg-white px-3 py-2.5 text-sm outline-none"
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
          className="bg-brand-red hover:bg-brand-red/90 ml-auto flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-bold text-white transition-colors duration-200"
        >
          <Plus className="size-4" />
          Add Menu Item
        </Link>
      </div>

      <div className="border-brand-line mt-6 overflow-hidden rounded-lg border bg-white">
        <table className="w-full">
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
                    <img src={item.image_url} alt="" className="size-12 rounded-md object-cover" />
                  ) : (
                    <span className="bg-brand-cream text-brand-gold-deep flex size-12 items-center justify-center rounded-md">
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
                    className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${item.is_available ? 'bg-brand-green' : 'bg-brand-ink/20'}`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform duration-200 ${item.is_available ? 'translate-x-5' : ''}`}
                    />
                  </button>
                </td>
                <td className={td}>
                  <div className="flex gap-2">
                    <Link
                      to={`/admin/menu/${item.item_id}/edit`}
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
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="text-brand-ink/60 px-4 py-10 text-center text-sm">
                  No menu items found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
            className="border-brand-line flex size-9 items-center justify-center rounded-md border bg-white disabled:opacity-40"
          >
            <ChevronLeft className="size-4" />
          </button>
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              aria-current={n === current ? 'page' : undefined}
              onClick={() => setPage(n)}
              className={`flex size-9 items-center justify-center rounded-md border text-sm font-semibold ${n === current ? 'bg-brand-charcoal border-brand-charcoal text-white' : 'border-brand-line bg-white'}`}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            aria-label="Next page"
            disabled={current >= pages}
            onClick={() => setPage(current + 1)}
            className="border-brand-line flex size-9 items-center justify-center rounded-md border bg-white disabled:opacity-40"
          >
            <ChevronRight className="size-4" />
          </button>
        </nav>
      </div>

      {deleting && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
          >
            <h2 id="delete-title" className="text-brand-charcoal font-serif text-2xl font-bold">
              Delete {deleting.name}?
            </h2>
            <p className="text-brand-ink/70 mt-2 text-sm">
              This removes the dish and its photo. It can&apos;t be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleting(null)}
                className="border-brand-line text-brand-charcoal rounded-md border px-4 py-2 text-sm font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={remove.isPending}
                onClick={() => remove.mutate(deleting)}
                className="bg-brand-red hover:bg-brand-red/90 rounded-md px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
