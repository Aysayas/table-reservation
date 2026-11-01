import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
  type CategoryWithCount,
} from '@/services/menu'

const th = 'text-brand-ink/70 px-4 py-3 text-left text-xs font-bold tracking-[0.1em] uppercase'
const td = 'text-brand-charcoal px-4 py-3 text-sm'
const smallButton = 'rounded-md border px-3 py-1.5 text-xs font-bold transition-colors duration-200'
const label = 'text-brand-charcoal block text-sm font-bold'
const field =
  'border-brand-line focus:border-brand-gold mt-2 block w-full rounded-md border bg-white px-4 py-3 text-sm font-normal outline-none placeholder:text-brand-ink/50'
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
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: getCategories })
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
      toast.success(`${c.name} deleted`)
      if (editing?.category_id === c.category_id) setEditing(null)
      refresh()
    },
    onError: (e) => toast.error(e.message),
    onSettled: () => setDeleting(null),
  })

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[1fr_24rem]">
      <div className="border-brand-line overflow-x-auto rounded-lg border bg-white">
        <table className="w-full">
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
            {categories.length === 0 && (
              <tr>
                <td colSpan={4} className="text-brand-ink/70 px-4 py-10 text-center text-sm">
                  No categories yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
            className="bg-brand-red hover:bg-brand-red/90 block w-full rounded-md py-3 text-sm font-bold text-white transition-colors duration-200 disabled:opacity-60"
          >
            Save Category
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="border-brand-line text-brand-charcoal block w-full rounded-md border py-3 text-sm font-bold"
            >
              Cancel Edit
            </button>
          )}
        </form>
      </section>

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
              {deleting.item_count
                ? `It still has ${deleting.item_count} dishes, so it can't be deleted yet.`
                : "This can't be undone."}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleting(null)}
                className="border-brand-line text-brand-charcoal rounded-md border px-4 py-2 text-sm font-bold"
              >
                {deleting.item_count ? 'Close' : 'Cancel'}
              </button>
              {!deleting.item_count && (
                <button
                  type="button"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(deleting)}
                  className="bg-brand-red hover:bg-brand-red/90 rounded-md px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
