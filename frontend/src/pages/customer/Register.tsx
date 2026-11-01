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
import {
  field,
  fieldError,
  label,
  passwordSchema,
  passwordsMatch,
  safeNext,
  submitButton,
  textLink,
} from '@/lib/accountForm'
import { apiError } from '@/lib/api'
import { mobileSchema, toLocalMobile } from '@/lib/mobile'
import { registerAccount } from '@/services/account'

const schema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(1, 'Enter your full name')
      .max(100, 'Use 100 characters or less'),
    mobile_number: mobileSchema,
    email: z.string().trim().pipe(z.email('Enter a valid email')),
    password: passwordSchema,
    confirm_password: z.string(),
  })
  .refine(passwordsMatch.check, passwordsMatch.error)

type FormValues = z.infer<typeof schema>

export default function Register() {
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
    defaultValues: {
      full_name: '',
      mobile_number: '',
      email: '',
      password: '',
      confirm_password: '',
    },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      const user = await registerAccount({
        full_name: values.full_name,
        mobile_number: toLocalMobile(values.mobile_number),
        email: values.email,
        password: values.password,
      })
      queryClient.setQueryData(['account'], user)
      navigate(next, { replace: true })
    } catch (e) {
      toast.error(apiError(e, "Couldn't create your account. Please try again."))
    }
  }

  if (account) return <Navigate to={next} replace />

  const carry = nextParam ? `?next=${encodeURIComponent(nextParam)}` : ''

  return (
    <AccountCard title="Create an Account" intro="All your bookings, in one place.">
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label htmlFor="full_name" className={label}>
            Full Name
          </label>
          <input
            id="full_name"
            autoComplete="name"
            placeholder="Juan Dela Cruz"
            aria-invalid={!!errors.full_name}
            {...register('full_name')}
            className={field}
          />
          {errors.full_name && (
            <p role="alert" className={fieldError}>
              {errors.full_name.message}
            </p>
          )}
        </div>
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
          <label htmlFor="email" className={label}>
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="name@email.com"
            aria-invalid={!!errors.email}
            {...register('email')}
            className={field}
          />
          {errors.email ? (
            <p role="alert" className={fieldError}>
              {errors.email.message}
            </p>
          ) : (
            <p className="text-brand-ink/75 mt-1.5 text-xs">
              We'll use this if you forget your password.
            </p>
          )}
        </div>
        <div>
          <label htmlFor="password" className={label}>
            Password
          </label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            invalid={!!errors.password}
            {...register('password')}
          />
          {errors.password ? (
            <p role="alert" className={fieldError}>
              {errors.password.message}
            </p>
          ) : (
            <p className="text-brand-ink/75 mt-1.5 text-xs">At least 8 characters.</p>
          )}
        </div>
        <div>
          <label htmlFor="confirm_password" className={label}>
            Confirm Password
          </label>
          <PasswordInput
            id="confirm_password"
            autoComplete="new-password"
            invalid={!!errors.confirm_password}
            {...register('confirm_password')}
          />
          {errors.confirm_password && (
            <p role="alert" className={fieldError}>
              {errors.confirm_password.message}
            </p>
          )}
        </div>
        <button type="submit" disabled={isSubmitting} className={submitButton}>
          Create Account
        </button>
      </form>
      <p className="text-brand-ink/75 mt-5 text-sm">
        Already have an account?{' '}
        <Link to={`/login${carry}`} className={textLink}>
          Log In
        </Link>
      </p>
    </AccountCard>
  )
}
