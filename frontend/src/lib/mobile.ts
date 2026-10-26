import { z } from 'zod'

export const cleanMobile = (text: string) => {
  let digits = text.replace(/\D/g, '')
  if (digits.startsWith('63') && digits.length > 10) digits = digits.slice(2)
  if (digits.startsWith('0')) digits = digits.slice(1)
  return digits.slice(0, 10)
}

export const toLocalMobile = (digits: string) => `0${digits}`

export const mobileSchema = z.string().regex(/^9\d{9}$/, 'Check your mobile number')
