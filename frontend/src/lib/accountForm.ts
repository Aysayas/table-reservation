import { z } from 'zod'

export const label = 'text-brand-charcoal text-xs font-bold tracking-[0.15em] uppercase'
export const field =
  'border-brand-line focus:border-brand-gold mt-2 w-full rounded-sm border bg-white px-4 py-3 text-sm font-normal tracking-normal normal-case outline-none placeholder:text-brand-ink/50'
export const fieldError = 'text-brand-red mt-1.5 text-xs'
export const textLink = 'text-brand-red font-bold hover:underline'
export const submitButton =
  'bg-brand-red hover:bg-brand-red/90 focus-visible:outline-brand-gold block w-full rounded-sm py-4 text-center text-sm font-bold tracking-[0.15em] text-white uppercase transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60'

export const passwordSchema = z
  .string()
  .min(8, 'Use at least 8 characters')
  .max(72, 'Use 72 characters or less')

export const passwordsMatch = {
  check: (values: { password: string; confirm_password: string }) =>
    values.password === values.confirm_password,
  error: { path: ['confirm_password'], message: "Passwords don't match" },
}

const resetNextKey = 'reset-next'

export function saveResetNext(next: string | null) {
  try {
    if (next) localStorage.setItem(resetNextKey, next)
    else localStorage.removeItem(resetNextKey)
  } catch {
    return
  }
}

export function takeResetNext() {
  try {
    const next = localStorage.getItem(resetNextKey)
    localStorage.removeItem(resetNextKey)
    return next
  } catch {
    return null
  }
}

export const safeNext = (next: string | null) =>
  next?.startsWith('/') && !next.startsWith('//') ? next : '/my-reservations'
