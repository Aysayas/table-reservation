import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { getSettings } from '@/services/settings'

const schema = z.object({
  email: z.email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
  remember: z.boolean(),
})

type LoginForm = z.infer<typeof schema>

const input =
  'border-brand-charcoal/20 focus:border-brand-gold focus:ring-brand-gold/30 mt-2 w-full rounded-sm border bg-white px-4 py-3 text-sm outline-none focus:ring-2 aria-invalid:border-brand-red'
const label = 'text-brand-charcoal text-xs font-bold tracking-[0.15em] uppercase'

export default function StaffLogin() {
  const navigate = useNavigate()
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: getSettings })
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', remember: false },
  })

  const onSubmit = () => navigate('/staff')

  return (
    <div className="bg-brand-cream flex min-h-screen items-center justify-center px-4 py-12">
      <div className="border-brand-gold/40 w-full max-w-[400px] rounded-lg border bg-white px-8 py-10 shadow-sm sm:px-10">
        <div className="text-center">
          <span className="border-brand-gold mx-auto block size-16 overflow-hidden rounded-full border">
            <img
              src={settings?.logo_url ?? '/logo.png'}
              alt={settings?.restaurant_name ?? 'Logo'}
              className="size-full scale-[2.2] object-cover object-top"
            />
          </span>
          <h1 className="text-brand-charcoal mt-6 font-serif text-4xl">Staff Login</h1>
          <p className="text-brand-ink/75 mt-2 text-sm">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className={label}>
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="name@email.com"
              aria-invalid={errors.email ? true : undefined}
              className={input}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-brand-red mt-1.5 text-xs">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className={label}>
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              aria-invalid={errors.password ? true : undefined}
              className={input}
              {...register('password')}
            />
            {errors.password && (
              <p className="text-brand-red mt-1.5 text-xs">{errors.password.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between gap-4 text-sm">
            <label className="text-brand-ink flex items-center gap-2">
              <input
                type="checkbox"
                className="accent-brand-red size-4"
                {...register('remember')}
              />
              Remember me
            </label>
            <button
              type="button"
              onClick={() => toast('Ask an admin to reset your password.')}
              className="text-brand-red font-semibold hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            className="bg-brand-red hover:bg-brand-red/90 focus-visible:outline-brand-red w-full rounded-sm py-4 text-sm font-bold tracking-[0.15em] text-white uppercase transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Log In
          </button>
        </form>
      </div>
    </div>
  )
}
