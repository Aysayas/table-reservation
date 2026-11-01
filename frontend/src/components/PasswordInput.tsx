import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'
import { field } from '@/lib/accountForm'

type Props = UseFormRegisterReturn & {
  id: string
  invalid: boolean
  autoComplete: 'current-password' | 'new-password'
}

export default function PasswordInput({ id, invalid, autoComplete, ...rest }: Props) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        autoComplete={autoComplete}
        aria-invalid={invalid}
        className={`${field} pr-12`}
        {...rest}
      />
      <button
        type="button"
        aria-label={show ? 'Hide password' : 'Show password'}
        onClick={() => setShow(!show)}
        className="text-brand-ink/70 hover:text-brand-charcoal absolute top-1/2 right-1 mt-1 flex size-11 -translate-y-1/2 items-center justify-center"
      >
        {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
      </button>
    </div>
  )
}
