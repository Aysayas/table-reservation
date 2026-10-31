import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import AccountCard from '@/components/AccountCard'
import { field, fieldError, label, submitButton, textLink } from '@/lib/accountForm'
import { apiError } from '@/lib/api'
import { forgotPassword } from '@/services/account'

const schema = z.object({
  email: z.string().trim().pipe(z.email('Enter a valid email')),
})

type FormValues = z.infer<typeof schema>

export default function ForgotPassword() {
  const [sent, setSent] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: '' } })

  const onSubmit = async ({ email }: FormValues) => {
    try {
      await forgotPassword(email)
      setSent(true)
    } catch (e) {
      toast.error(apiError(e, "Couldn't send the email. Please try again."))
    }
  }

  return (
    <AccountCard
      title="Forgot Password"
      intro={sent ? undefined : "Enter your account's email and we'll send you a reset link."}
    >
      {sent ? (
        <p role="status" className="text-brand-charcoal text-sm">
          If that email has an account, we sent a reset link. It works for 1 hour. Check your spam
          folder if you can't find it.
        </p>
      ) : (
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
            {errors.email && (
              <p role="alert" className={fieldError}>
                {errors.email.message}
              </p>
            )}
          </div>
          <button type="submit" disabled={isSubmitting} className={submitButton}>
            Send Reset Link
          </button>
        </form>
      )}
      <p className="mt-5 text-sm">
        <Link to="/login" className={textLink}>
          Back to Log In
        </Link>
      </p>
    </AccountCard>
  )
}
