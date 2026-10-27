import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { apiError } from '@/lib/api'
import { login } from '@/services/auth'
import { getSettings } from '@/services/settings'

const schema = z.object({
  email: z.email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
  remember: z.boolean(),
})

type LoginForm = z.infer<typeof schema>

const input =
  'border-brand-gold/50 focus:border-brand-gold focus:ring-brand-gold/30 aria-invalid:border-brand-red mt-2 w-full rounded-lg border bg-white px-4 py-3.5 text-sm outline-none focus:ring-2'
const label = 'text-brand-charcoal text-xs font-bold tracking-[0.15em] uppercase'

export default function StaffLogin() {
  const navigate = useNavigate()
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: getSettings })
  const [showPassword, setShowPassword] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', remember: false },
  })

  const onSubmit = async ({ email, password }: LoginForm) => {
    try {
      const user = await login(email, password)
      navigate(user.role === 'admin' ? '/admin' : user.role === 'kitchen' ? '/kitchen' : '/staff')
    } catch (e) {
      toast.error(apiError(e))
    }
  }

  return (
    <div className="bg-brand-cream flex min-h-screen items-center justify-center px-4 py-16">
      <div className="border-brand-gold/40 relative w-full max-w-[420px] rounded-2xl border bg-white px-8 pt-20 pb-10 shadow-sm sm:px-10">
        <div className="text-center">
          <span className="border-brand-gold/60 bg-brand-cream absolute -top-14 left-1/2 block size-28 -translate-x-1/2 rounded-full border p-2">
            <span className="block size-full overflow-hidden rounded-full">
              <img
                src={settings?.logo_url ?? '/logo.png'}
                alt={settings?.restaurant_name ?? 'Logo'}
                className="size-full scale-[2.2] object-cover object-top"
              />
            </span>
          </span>
          <p className="text-brand-red text-xs font-bold tracking-[0.3em] uppercase">
            Staff portal
          </p>
          <h1 className="text-brand-charcoal mt-3 font-serif text-5xl">Staff Login</h1>
          <p className="text-brand-ink/75 mt-2 text-sm">Sign in to manage today's reservations.</p>
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
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                aria-invalid={errors.password ? true : undefined}
                className={`${input} pr-12`}
                {...register('password')}
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(!showPassword)}
                className="text-brand-ink/60 hover:text-brand-charcoal absolute top-1/2 right-3 mt-1 flex size-8 -translate-y-1/2 items-center justify-center rounded-md transition-colors duration-200"
              >
                {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-brand-red mt-1.5 text-xs">{errors.password.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between gap-4 text-sm">
            <label className="text-brand-ink flex items-center gap-2">
              <input
                type="checkbox"
                className="accent-brand-red size-5"
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
            disabled={isSubmitting}
            className="bg-brand-red hover:bg-brand-red/90 focus-visible:outline-brand-red w-full rounded-lg py-4 text-sm font-bold tracking-[0.15em] text-white uppercase transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60"
          >
            Log In
          </button>
        </form>
      </div>
    </div>
  )
}
