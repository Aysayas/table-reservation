import type { ChangeEvent } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'
import { cleanMobile } from '@/lib/mobile'

type Props = UseFormRegisterReturn & {
  id: string
  invalid: boolean
  className?: string
}

export default function MobileInput({ id, invalid, className = '', onChange, ...field }: Props) {
  return (
    <div
      className={`border-brand-line focus-within:border-brand-gold mt-2 flex overflow-hidden rounded-sm border bg-white ${className}`}
    >
      <span className="bg-brand-cream text-brand-charcoal border-brand-line flex items-center border-r px-3 text-sm font-semibold select-none">
        +63
      </span>
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder="912 345 6789"
        aria-invalid={invalid}
        {...field}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          e.target.value = cleanMobile(e.target.value)
          return onChange(e)
        }}
        className="placeholder:text-brand-ink/65 w-full bg-transparent px-4 py-3 text-sm tracking-normal normal-case outline-none"
      />
    </div>
  )
}
