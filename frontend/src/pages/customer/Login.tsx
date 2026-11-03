import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import AccountCard from '@/components/AccountCard'
import MobileInput from '@/components/MobileInput'
import PasswordInput from '@/components/PasswordInput'
import useAccount from '@/hooks/useAccount'
import { fieldError, label, safeNext, submitButton, textLink } from '@/lib/accountForm'
import { apiError } from '@/lib/api'
import { mobileSchema, toLocalMobile } from '@/lib/mobile'
import { loginAccount } from '@/services/account'

const schema = z.object({
  mobile_number: mobileSchema,
  password: z.string().min(1, 'Enter your password'),
})

type FormValues = z.infer<typeof schema>

export default function Login() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [params] = useSearchParams()
  const nextParam = params.get('next')
  const next = safeNext(nextParam)
  const { data: account } = useAccount()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { mobile_number: '', password: '' },
  })

  const onSubmit = async ({ mobile_number, password }: FormValues) => {
    try {
      const user = await loginAccount(toLocalMobile(mobile_number), password)
      queryClient.setQueryData(['account'], user)
      navigate(next, { replace: true })
    } catch (e) {
      toast.error(apiError(e, "Couldn't log you in. Please try again."))
    }
  }

  if (account) return <Navigate to={next} replace />

  const carry = nextParam ? `?next=${encodeURIComponent(nextParam)}` : ''

  return (
    <AccountCard
      title="Log In"
      intro={
        next.startsWith('/reserve')
          ? 'Log in or create an account to book. You can then see and change your reservations anytime.'
          : 'Log in to reserve a table and keep track of your bookings.'
      }
    >
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label htmlFor="mobile_number" className={label}>
            Mobile Number
          </label>
          <MobileInput
            id="mobile_number"
            invalid={!!errors.mobile_number}
            {...register('mobile_number')}
          />
          {errors.mobile_number && (
            <p role="alert" className={fieldError}>
              {errors.mobile_number.message}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="password" className={label}>
            Password
          </label>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            invalid={!!errors.password}
            {...register('password')}
          />
          {errors.password && (
            <p role="alert" className={fieldError}>
              {errors.password.message}
            </p>
          )}
        </div>
        <button type="submit" disabled={isSubmitting} className={submitButton}>
          Log In
        </button>
      </form>
      <div className="mt-5 flex flex-wrap justify-between gap-3 text-sm">
        <Link to={`/forgot-password${carry}`} className={textLink}>
          Forgot password?
        </Link>
        <Link to={`/register${carry}`} className={textLink}>
          Create an account
        </Link>
      </div>
    </AccountCard>
  )
}
