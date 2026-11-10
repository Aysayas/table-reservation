import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Tags } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import EmptyState from '@/components/EmptyState'
import LoadError from '@/components/LoadError'
import Modal from '@/components/Modal'
import Skeleton from '@/components/Skeleton'
import Spinner from '@/components/Spinner'
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
  type CategoryWithCount,
} from '@/services/menu'

const th = 'text-brand-ink/70 px-4 py-3 text-left text-xs font-bold tracking-label uppercase'
const td = 'text-brand-charcoal px-4 py-3 text-sm'
const smallButton =
  'pointer-coarse:min-h-11 inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors duration-200'
const dl = 'grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm'
const dt = 'text-brand-ink/70'
const dd = 'text-brand-charcoal text-right'
const label = 'text-brand-charcoal block text-sm font-bold'
const field =
  'border-brand-line focus:border-brand-gold mt-2 block w-full rounded-lg border bg-white px-4 py-3 text-sm font-normal outline-none placeholder:text-brand-ink/65'
const error = 'text-brand-red mt-1.5 text-xs'

const schema = z.object({
  name: z.string().trim().min(1, 'Enter a category name').max(50, 'Use 50 characters or less'),
  sort_order: z
    .number({ error: 'Enter a display order' })
    .int('Use a whole number')
    .min(0, 'Use 0 or more'),
})

type FormValues = z.infer<typeof schema>

export default function Categories() {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<CategoryWithCount | null>(null)
  const [deleting, setDeleting] = useState<CategoryWithCount | null>(null)
  const {
    data: categories = [],
    isPending,
    isLoadingError,
    refetch,
  } = useQuery({ queryKey: ['categories'], queryFn: getCategories })
  const nextOrder = Math.max(0, ...categories.map((c) => c.sort_order)) + 1

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: editing
      ? { name: editing.name, sort_order: editing.sort_order }
      : { name: '', sort_order: nextOrder },
  })

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['categories'] })
    queryClient.invalidateQueries({ queryKey: ['menu-items'] })
  }

  const onSubmit = async (values: FormValues) => {
    try {
      const saved = editing
        ? await updateCategory(editing.category_id, values)
        : await createCategory(values)
      toast.success(`${saved.name} saved`)
      setEditing(null)
      reset()
      refresh()
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  const remove = useMutation({
    mutationFn: (c: CategoryWithCount) => deleteCategory(c.category_id),
    onSuccess: (_, c) => {
      setDeleting(null)
      toast.success(`${c.name} deleted`)
      if (editing?.category_id === c.category_id) setEditing(null)
      refresh()
    },
  })
  const closeDelete = () => {
    setDeleting(null)
    remove.reset()
  }

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[1fr_24rem]">
      {isLoadingError ? (
        <div>
          <LoadError what="the categories" onRetry={() => refetch()} />
        </div>
      ) : (
        <div className="border-brand-line overflow-x-auto rounded-lg border bg-white">
          <ul className="divide-brand-line divide-y md:hidden">
            {categories.map((c) => (
              <li
                key={c.category_id}
                className={`space-y-3 p-4 ${editing?.category_id === c.category_id ? 'bg-brand-gold/10' : ''}`}
              >
                <p className="text-brand-charcoal font-semibold">{c.name}</p>
                <dl className={dl}>
                  <dt className={dt}>Order</dt>
                  <dd className={`${dd} tabular-nums`}>{c.sort_order}</dd>
                  <dt className={dt}>Items</dt>
                  <dd className={`${dd} tabular-nums`}>{c.item_count}</dd>
                </dl>
                <div className="flex gap-2 *:flex-1">
                  <button
                    type="button"
                    aria-label={`Edit ${c.name}`}
                    onClick={() => setEditing(c)}
                    className={`${smallButton} border-brand-charcoal text-brand-charcoal hover:bg-brand-charcoal hover:text-white`}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${c.name}`}
                    onClick={() => setDeleting(c)}
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
                {['Order', 'Category Name', 'Items', 'Actions'].map((h) => (
                  <th key={h} className={th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr
                  key={c.category_id}
                  className={`border-brand-line border-t ${editing?.category_id === c.category_id ? 'bg-brand-gold/10' : ''}`}
                >
                  <td className={`${td} tabular-nums`}>{c.sort_order}</td>
                  <td className={`${td} font-semibold`}>{c.name}</td>
                  <td className={`${td} tabular-nums`}>{c.item_count}</td>
                  <td className={td}>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        aria-label={`Edit ${c.name}`}
                        onClick={() => setEditing(c)}
                        className={`${smallButton} border-brand-charcoal text-brand-charcoal hover:bg-brand-charcoal hover:text-white`}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${c.name}`}
                        onClick={() => setDeleting(c)}
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
                    {Array.from({ length: 4 }, (_, j) => (
                      <td key={j} className={td}>
                        <Skeleton className="h-4 w-full max-w-28" />
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
          {!isPending && categories.length === 0 && (
            <EmptyState icon={Tags} title="No categories yet." />
          )}
        </div>
      )}

      <section
        aria-labelledby="category-form-title"
        className="border-brand-line rounded-lg border bg-white p-6"
      >
        <h2 id="category-form-title" className="text-brand-charcoal font-serif text-xl font-bold">
          {editing ? 'Edit Category' : 'Add Category'}
        </h2>
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-5">
          <div>
            <label htmlFor="category_name" className={label}>
              Category Name
            </label>
            <input
              id="category_name"
              placeholder="e.g. Grilled"
              aria-invalid={!!errors.name}
              {...register('name')}
              className={field}
            />
            {errors.name && <p className={error}>{errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="sort_order" className={label}>
              Display Order
            </label>
            <input
              id="sort_order"
              type="number"
              min="0"
              step="1"
              aria-invalid={!!errors.sort_order}
              {...register('sort_order', { valueAsNumber: true })}
              className={field}
            />
            {errors.sort_order && <p className={error}>{errors.sort_order.message}</p>}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            className="bg-brand-red hover:bg-brand-red/90 lift flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold text-white duration-200 disabled:opacity-60"
          >
            {isSubmitting && <Spinner />}
            Save Category
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="border-brand-line text-brand-charcoal block w-full rounded-lg border py-3 text-sm font-bold"
            >
              Cancel Edit
            </button>
          )}
        </form>
      </section>

      {deleting && (
        <Modal
          title={`Delete ${deleting.name}?`}
          onClose={closeDelete}
          dismissible={!remove.isPending}
          framed
          error={remove.error?.message}
        >
          <p className="text-brand-ink/70 text-center text-sm">
            {deleting.item_count
              ? `It still has ${deleting.item_count} dishes, so it can't be deleted yet.`
              : "This can't be undone."}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              disabled={remove.isPending}
              onClick={closeDelete}
              className="border-brand-line text-brand-charcoal rounded-lg border px-4 py-2 text-sm font-bold disabled:opacity-50"
            >
              {deleting.item_count ? 'Close' : 'Cancel'}
            </button>
            {!deleting.item_count && (
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
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
