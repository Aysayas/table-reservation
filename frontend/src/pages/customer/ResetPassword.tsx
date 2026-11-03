import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import AccountCard from '@/components/AccountCard'
import PasswordInput from '@/components/PasswordInput'
import {
  fieldError,
  label,
  passwordSchema,
  passwordsMatch,
  submitButton,
  takeResetNext,
  textLink,
} from '@/lib/accountForm'
import { apiError } from '@/lib/api'
import { resetPassword } from '@/services/account'

const schema = z
  .object({ password: passwordSchema, confirm_password: z.string() })
  .refine(passwordsMatch.check, passwordsMatch.error)

type FormValues = z.infer<typeof schema>

export default function ResetPassword() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [failed, setFailed] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirm_password: '' },
  })

  const onSubmit = async ({ password }: FormValues) => {
    try {
      await resetPassword(token, password)
      queryClient.setQueryData(['account'], null)
      toast.success('Your password was changed. Please log in.')
      const next = takeResetNext()
      navigate(next ? `/login?next=${encodeURIComponent(next)}` : '/login', { replace: true })
    } catch (e) {
      setFailed(apiError(e, "Couldn't change your password. Please try again."))
    }
  }

  if (!token) {
    return (
      <AccountCard title="Reset Password">
        <p className="text-brand-charcoal text-sm">This reset link is invalid or has expired.</p>
        <p className="mt-5 text-sm">
          <Link
            to="/forgot-password"
            className={`${textLink} inline-flex items-center pointer-coarse:min-h-11`}
          >
            Send a new link
          </Link>
        </p>
      </AccountCard>
    )
  }

  return (
    <AccountCard title="Reset Password" intro="Choose a new password for your account.">
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label htmlFor="password" className={label}>
            New Password
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
            Confirm New Password
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
        {failed && (
          <p role="alert" className="text-brand-red text-sm">
            {failed}{' '}
            <Link to="/forgot-password" className="font-bold underline">
              Send a new link
            </Link>
          </p>
        )}
        <button type="submit" disabled={isSubmitting} className={submitButton}>
          Save New Password
        </button>
      </form>
    </AccountCard>
  )
}
