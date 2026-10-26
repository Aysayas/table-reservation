import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ImagePlus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useForm, useWatch, type Control } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import {
  createMenuItem,
  getCategories,
  getMenuItem,
  updateMenuItem,
  uploadMenuImage,
} from '@/services/menu'

const label = 'text-brand-charcoal block text-sm font-bold'
const field =
  'border-brand-line focus:border-brand-gold mt-2 block w-full rounded-md border bg-white px-4 py-3 text-sm font-normal outline-none placeholder:text-brand-ink/50'
const error = 'text-brand-red mt-1.5 text-xs'

const schema = z.object({
  name: z.string().trim().min(1, 'Enter the item name').max(100, 'Use 100 characters or less'),
  category_id: z.number().int().min(1, 'Choose a category'),
  price: z
    .number({ error: 'Enter a price' })
    .min(0, 'The price cannot be negative')
    .max(99999999.99, 'That price is too high'),
  description: z.string().trim().max(1000, 'Use 1000 characters or less'),
  is_available: z.boolean(),
  is_recommended: z.boolean(),
})

type FormValues = z.infer<typeof schema>

function Toggle({
  control,
  name,
  title,
  hint,
  onChange,
}: {
  control: Control<FormValues>
  name: 'is_available' | 'is_recommended'
  title: string
  hint: string
  onChange: (value: boolean) => void
}) {
  const on = useWatch({ control, name })
  return (
    <div>
      <p id={`${name}-label`} className={label}>
        {title}
      </p>
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-labelledby={`${name}-label`}
          onClick={() => onChange(!on)}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${on ? 'bg-brand-green' : 'bg-brand-ink/20'}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform duration-200 ${on ? 'translate-x-5' : ''}`}
          />
        </button>
        <span className="text-brand-ink/70 text-sm">{hint}</span>
      </div>
    </div>
  )
}

export default function MenuItemForm() {
  const { id } = useParams()
  const editing = id !== undefined
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const fileInput = useRef<HTMLInputElement>(null)
  const [photo, setPhoto] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: getCategories })
  const { data: item, isFetched } = useQuery({
    queryKey: ['menu-item', Number(id)],
    queryFn: () => getMenuItem(Number(id)),
    enabled: editing,
  })

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      category_id: 0,
      price: undefined,
      description: '',
      is_available: true,
      is_recommended: true,
    },
  })

  useEffect(() => {
    if (!item) return
    reset({
      name: item.name,
      category_id: item.category_id,
      price: item.price,
      description: item.description ?? '',
      is_available: item.is_available,
      is_recommended: item.is_recommended,
    })
  }, [item, reset])

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview)
    },
    [preview],
  )

  const pick = (file: File | undefined) => {
    if (!file) return
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast.error('Use a JPG or PNG photo')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Use a photo up to 2 MB')
      return
    }
    setPhoto(file)
    setPreview(URL.createObjectURL(file))
  }

  const onSubmit = async (values: FormValues) => {
    try {
      const body = { ...values, description: values.description || null }
      const saved = editing ? await updateMenuItem(Number(id), body) : await createMenuItem(body)
      if (photo) await uploadMenuImage(saved.item_id, photo)
      await queryClient.invalidateQueries({ queryKey: ['menu-items'] })
      await queryClient.invalidateQueries({ queryKey: ['menu-item', saved.item_id] })
      toast.success(`${saved.name} saved`)
      navigate('/admin/menu')
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  if (editing && isFetched && !item) {
    return (
      <div className="py-16 text-center">
        <h2 className="text-brand-charcoal font-serif text-2xl font-bold">Menu item not found</h2>
        <Link to="/admin/menu" className="text-brand-red mt-4 inline-block text-sm font-bold">
          Back to Menu
        </Link>
      </div>
    )
  }

  const shown = preview ?? item?.image_url ?? null

  return (
    <div>
      <nav aria-label="Breadcrumb" className="text-brand-ink/60 text-sm">
        <Link to="/admin/menu" className="hover:text-brand-red">
          Menu
        </Link>
        <span className="mx-2">/</span>
        <span className="text-brand-charcoal">{editing ? 'Edit Menu Item' : 'Add Menu Item'}</span>
      </nav>

      <form
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className="mt-4 grid items-start gap-6 xl:grid-cols-[1fr_24rem]"
      >
        <div className="border-brand-line space-y-6 rounded-lg border bg-white p-6 md:p-8">
          <div>
            <label htmlFor="name" className={label}>
              Item Name
            </label>
            <input
              id="name"
              placeholder="Enter item name"
              aria-invalid={!!errors.name}
              {...register('name')}
              className={field}
            />
            {errors.name && <p className={error}>{errors.name.message}</p>}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="category_id" className={label}>
                Category
              </label>
              <select
                id="category_id"
                aria-invalid={!!errors.category_id}
                {...register('category_id', { valueAsNumber: true })}
                className={field}
              >
                <option value={0}>Select category</option>
                {categories.map((c) => (
                  <option key={c.category_id} value={c.category_id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.category_id && <p className={error}>{errors.category_id.message}</p>}
            </div>
            <div>
              <label htmlFor="price" className={label}>
                Price (₱)
              </label>
              <input
                id="price"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="0.00"
                aria-invalid={!!errors.price}
                {...register('price', { valueAsNumber: true })}
                className={field}
              />
              {errors.price && <p className={error}>{errors.price.message}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="description" className={label}>
              Description
            </label>
            <textarea
              id="description"
              rows={4}
              placeholder="Short description of the dish"
              aria-invalid={!!errors.description}
              {...register('description')}
              className={`${field} resize-none`}
            />
            {errors.description && <p className={error}>{errors.description.message}</p>}
          </div>

          <Toggle
            control={control}
            name="is_available"
            title="Available"
            hint="Show this item on the menu"
            onChange={(v) => setValue('is_available', v)}
          />
          <Toggle
            control={control}
            name="is_recommended"
            title="Show in Recommendations"
            hint="Allow this item to be suggested to customers"
            onChange={(v) => setValue('is_recommended', v)}
          />

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-brand-red hover:bg-brand-red/90 rounded-md px-8 py-3 text-sm font-bold text-white transition-colors duration-200 disabled:opacity-60"
            >
              Save Item
            </button>
            <Link
              to="/admin/menu"
              className="border-brand-charcoal text-brand-charcoal hover:bg-brand-charcoal rounded-md border px-8 py-3 text-sm font-bold transition-colors duration-200 hover:text-white"
            >
              Cancel
            </Link>
          </div>
        </div>

        <section
          aria-labelledby="photo-title"
          className="border-brand-line rounded-lg border bg-white p-6"
        >
          <h2 id="photo-title" className="text-brand-charcoal font-serif text-xl font-bold">
            Photo
          </h2>
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              pick(e.dataTransfer.files[0])
            }}
            className={`mt-4 flex aspect-[4/3] flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed transition-colors duration-200 ${dragging ? 'border-brand-gold bg-brand-gold/10' : 'border-brand-line bg-brand-cream/60'}`}
          >
            {shown ? (
              <img src={shown} alt="Photo preview" className="size-full object-cover" />
            ) : (
              <>
                <ImagePlus className="text-brand-gold-deep size-8" strokeWidth={1.5} />
                <p className="text-brand-charcoal mt-3 text-sm font-bold">Drag a photo here</p>
                <p className="text-brand-ink/60 mt-1 text-xs">JPG or PNG</p>
              </>
            )}
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png"
            aria-label="Photo file"
            className="hidden"
            onChange={(e) => pick(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="border-brand-charcoal text-brand-charcoal hover:bg-brand-charcoal mt-4 block w-full rounded-md border py-3 text-sm font-bold transition-colors duration-200 hover:text-white"
          >
            Upload Photo
          </button>
          {photo && <p className="text-brand-ink/60 mt-2 text-xs">{photo.name}</p>}
        </section>
      </form>
    </div>
  )
}
