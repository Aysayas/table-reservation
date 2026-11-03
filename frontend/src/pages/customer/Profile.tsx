import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import AccountCard from '@/components/AccountCard'
import MobileInput from '@/components/MobileInput'
import PageLoader from '@/components/PageLoader'
import PasswordInput from '@/components/PasswordInput'
import useAccount from '@/hooks/useAccount'
import { field, fieldError, label, submitButton, textLink } from '@/lib/accountForm'
import { apiError } from '@/lib/api'
import { cleanMobile, mobileSchema, toLocalMobile } from '@/lib/mobile'
import { updateProfile } from '@/services/account'

const schema = z.object({
  full_name: z
    .string()
    .trim()
    .min(1, 'Enter your full name')
    .max(100, 'Use 100 characters or less'),
  mobile_number: mobileSchema,
  email: z.string().trim().pipe(z.email('Enter a valid email')),
  current_password: z.string(),
})

type FormValues = z.infer<typeof schema>

export default function Profile() {
  const { pathname } = useLocation()
  const queryClient = useQueryClient()
  const { data: account, isLoading } = useAccount()
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: account
      ? {
          full_name: account.full_name,
          mobile_number: cleanMobile(account.mobile_number),
          email: account.email,
          current_password: '',
        }
      : undefined,
  })
  const mobile = useWatch({ control, name: 'mobile_number' }) ?? ''
  const email = useWatch({ control, name: 'email' }) ?? ''
  const contactChanged =
    !!account &&
    (toLocalMobile(mobile) !== account.mobile_number ||
      email.trim().toLowerCase() !== account.email)

  if (isLoading) return <PageLoader />
  if (!account) return <Navigate to={`/login?next=${encodeURIComponent(pathname)}`} replace />

  const onSubmit = async (values: FormValues) => {
    if (contactChanged && !values.current_password) {
      setError('current_password', { message: 'Enter your current password' })
      return
    }
    try {
      const user = await updateProfile({
        full_name: values.full_name,
        mobile_number: toLocalMobile(values.mobile_number),
        email: values.email,
        current_password: contactChanged ? values.current_password : undefined,
      })
      queryClient.setQueryData(['account'], user)
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] })
      toast.success('Your details were saved')
    } catch (e) {
      toast.error(apiError(e, "Couldn't save your details. Please try again."))
    }
  }

  return (
    <AccountCard title="Profile" intro="These details are used for your bookings.">
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label htmlFor="full_name" className={label}>
            Full Name
          </label>
          <input
            id="full_name"
            autoComplete="name"
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
          {errors.mobile_number ? (
            <p role="alert" className={fieldError}>
              {errors.mobile_number.message}
            </p>
          ) : (
            <p className="text-brand-ink/75 mt-1.5 text-xs">You log in with this number.</p>
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
            aria-invalid={!!errors.email}
            {...register('email')}
            className={field}
          />
          {errors.email && (
            <p role="alert" className={fieldError}>
              {errors.email.message}
            </p>
          )}
        </div>
        {contactChanged && (
          <div>
            <label htmlFor="current_password" className={label}>
              Current Password
            </label>
            <PasswordInput
              id="current_password"
              autoComplete="current-password"
              invalid={!!errors.current_password}
              {...register('current_password')}
            />
            {errors.current_password ? (
              <p role="alert" className={fieldError}>
                {errors.current_password.message}
              </p>
            ) : (
              <p className="text-brand-ink/75 mt-1.5 text-xs">
                Needed to change your mobile number or email.
              </p>
            )}
          </div>
        )}
        <button type="submit" disabled={isSubmitting} className={submitButton}>
          Save Changes
        </button>
      </form>
      <p className="text-brand-ink/75 mt-5 text-sm">
        Want a new password?{' '}
        <Link to="/forgot-password" className={textLink}>
          Change password
        </Link>
      </p>
    </AccountCard>
  )
}
