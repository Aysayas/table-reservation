import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { createUser, roleNames, updateUser } from '@/services/users'
import type { User } from '@/types/db'

const label = 'text-brand-charcoal block text-sm font-bold'
const field =
  'border-brand-line focus:border-brand-gold mt-2 block w-full rounded-md border bg-white px-4 py-3 text-sm font-normal outline-none disabled:bg-brand-cream/60 placeholder:text-brand-ink/50'
const error = 'text-brand-red mt-1.5 text-xs'

const password = z.string().min(8, 'Use at least 8 characters').max(72, 'Use 72 characters or less')

const schema = (adding: boolean) =>
  z.object({
    full_name: z.string().trim().min(1, 'Enter a full name').max(100, 'Use 100 characters or less'),
    email: z.email('Enter a valid email'),
    role: z.enum(['admin', 'staff', 'kitchen']),
    password: adding ? password : z.union([z.literal(''), password]),
  })

type FormValues = z.infer<ReturnType<typeof schema>>

type Props = { user: User | null; isSelf: boolean; onClose: () => void }

export default function StaffDialog({ user, isSelf, onClose }: Props) {
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema(!user)),
    defaultValues: user
      ? { full_name: user.full_name, email: user.email, role: user.role, password: '' }
      : { full_name: '', email: '', role: 'staff', password: '' },
  })

  const onSubmit = async ({ password, ...values }: FormValues) => {
    try {
      const body = { ...values, password: password || undefined }
      const saved = user ? await updateUser(user.user_id, body) : await createUser(body)
      toast.success(`${saved.full_name} saved`)
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['me'] })
      onClose()
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="staff-dialog-title"
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
      >
        <h2 id="staff-dialog-title" className="text-brand-charcoal font-serif text-2xl font-bold">
          {user ? 'Edit Staff' : 'Add Staff'}
        </h2>
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
          <div>
            <label htmlFor="full_name" className={label}>
              Full Name
            </label>
            <input
              id="full_name"
              placeholder="Juan Dela Cruz"
              aria-invalid={!!errors.full_name}
              {...register('full_name')}
              className={field}
            />
            {errors.full_name && <p className={error}>{errors.full_name.message}</p>}
          </div>
          <div>
            <label htmlFor="email" className={label}>
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="name@placeholder-domain.com"
              aria-invalid={!!errors.email}
              {...register('email')}
              className={field}
            />
            {errors.email && <p className={error}>{errors.email.message}</p>}
          </div>
          <div>
            <label htmlFor="role" className={label}>
              Role
            </label>
            {isSelf && user ? (
              <>
                <input id="role" readOnly value={roleNames[user.role]} className={field} />
                <p className="text-brand-ink/70 mt-1.5 text-xs">You can't change your own role.</p>
              </>
            ) : (
              <select id="role" {...register('role')} className={field}>
                {Object.entries(roleNames).map(([value, name]) => (
                  <option key={value} value={value}>
                    {name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label htmlFor="password" className={label}>
              {user ? 'New Password' : 'Password'}
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder={user ? 'Leave blank to keep the current one' : '8 characters or more'}
              aria-invalid={!!errors.password}
              {...register('password')}
              className={field}
            />
            {errors.password && <p className={error}>{errors.password.message}</p>}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="border-brand-line text-brand-charcoal rounded-md border px-4 py-2 text-sm font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-brand-red hover:bg-brand-red/90 rounded-md px-4 py-2 text-sm font-bold text-white transition-colors duration-200 disabled:opacity-60"
            >
              Save Staff
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
