import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import AccountCard from '@/components/AccountCard'
import PasswordInput from '@/components/PasswordInput'
import { fieldError, label, passwordSchema, submitButton, textLink } from '@/lib/accountForm'
import { apiError } from '@/lib/api'
import { resetPassword } from '@/services/account'

const schema = z.object({ password: passwordSchema })

type FormValues = z.infer<typeof schema>

export default function ResetPassword() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [failed, setFailed] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { password: '' } })

  const onSubmit = async ({ password }: FormValues) => {
    try {
      await resetPassword(token, password)
      toast.success('Your password was changed. Please log in.')
      navigate('/login', { replace: true })
    } catch (e) {
      setFailed(apiError(e, "Couldn't change your password. Please try again."))
    }
  }

  if (!token) {
    return (
      <AccountCard title="Reset Password">
        <p className="text-brand-charcoal text-sm">This reset link is invalid or has expired.</p>
        <p className="mt-5 text-sm">
          <Link to="/forgot-password" className={textLink}>
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
