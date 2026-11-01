import { api, getToken, setTokens, USE_SAMPLE } from '@/lib/api'
import { getReservationByCode } from '@/services/reservations'
import { sampleAccounts, sampleCustomers, sampleReservations } from '@/services/sampleData'
import type { CustomerAccount, PublicReservation } from '@/types/db'

const sampleSessionKey = 'sample-account'

function sampleSession(account: CustomerAccount | null) {
  try {
    if (account) sessionStorage.setItem(sampleSessionKey, String(account.user_id))
    else sessionStorage.removeItem(sampleSessionKey)
  } catch {
    return
  }
}

function readSampleSession() {
  try {
    return Number(sessionStorage.getItem(sampleSessionKey)) || null
  } catch {
    return null
  }
}

export type NewAccount = {
  full_name: string
  mobile_number: string
  email: string
  password: string
}

export async function registerAccount(body: NewAccount): Promise<CustomerAccount> {
  if (USE_SAMPLE) {
    if (sampleAccounts.some((a) => a.mobile_number === body.mobile_number)) {
      throw new Error('An account with that mobile number already exists.')
    }
    if (sampleAccounts.some((a) => a.email === body.email.toLowerCase())) {
      throw new Error('An account with that email already exists.')
    }
    const account: CustomerAccount = {
      user_id: Math.max(0, ...sampleAccounts.map((a) => a.user_id)) + 1,
      full_name: body.full_name,
      mobile_number: body.mobile_number,
      email: body.email.toLowerCase(),
      role: 'customer',
    }
    sampleAccounts.push(account)
    sampleSession(account)
    return account
  }
  const res = await api.post('/auth/register', body)
  setTokens(res.data.data.access_token, res.data.data.refresh_token)
  return res.data.data.user
}

export async function loginAccount(
  mobile_number: string,
  password: string,
): Promise<CustomerAccount> {
  if (USE_SAMPLE) {
    const account = sampleAccounts.find((a) => a.mobile_number === mobile_number)
    if (!account || password === 'wrongpassword') {
      throw new Error('Invalid mobile number or password')
    }
    sampleSession(account)
    return account
  }
  const res = await api.post('/auth/customer-login', { mobile_number, password })
  setTokens(res.data.data.access_token, res.data.data.refresh_token)
  return res.data.data.user
}

export async function getAccount(): Promise<CustomerAccount | null> {
  if (USE_SAMPLE) {
    const id = readSampleSession()
    return sampleAccounts.find((a) => a.user_id === id) ?? null
  }
  if (!getToken()) return null
  try {
    const res = await api.get('/auth/me')
    return res.data.data.role === 'customer' ? res.data.data : null
  } catch {
    return null
  }
}

export type ProfileChanges = {
  full_name: string
  mobile_number: string
  email: string
  current_password?: string
}

export async function updateProfile(body: ProfileChanges): Promise<CustomerAccount> {
  if (USE_SAMPLE) {
    const account = sampleAccounts.find((a) => a.user_id === readSampleSession())
    if (!account) throw new Error('Please log in again.')
    if (body.current_password === 'wrongpassword') {
      throw new Error('Your current password is wrong.')
    }
    const email = body.email.trim().toLowerCase()
    if (sampleAccounts.some((a) => a !== account && a.mobile_number === body.mobile_number)) {
      throw new Error('An account with that mobile number already exists.')
    }
    if (sampleAccounts.some((a) => a !== account && a.email === email)) {
      throw new Error('An account with that email already exists.')
    }
    for (const customer of sampleCustomers) {
      if (customer.mobile_number === account.mobile_number) {
        customer.full_name = body.full_name
        customer.mobile_number = body.mobile_number
        customer.email = email
      }
    }
    const updated = {
      ...account,
      full_name: body.full_name,
      mobile_number: body.mobile_number,
      email,
    }
    sampleAccounts[sampleAccounts.indexOf(account)] = updated
    return updated
  }
  const res = await api.patch('/my/profile', body)
  return res.data.data
}

export async function logoutAccount(): Promise<void> {
  if (USE_SAMPLE) {
    sampleSession(null)
    return
  }
  const refresh_token = localStorage.getItem('refresh_token')
  try {
    if (refresh_token) await api.post('/auth/logout', { refresh_token })
  } catch {
    return
  } finally {
    setTokens(null)
  }
}

export async function forgotPassword(email: string): Promise<void> {
  if (USE_SAMPLE) return
  await api.post('/auth/forgot-password', { email })
}

export async function resetPassword(token: string, password: string): Promise<void> {
  if (USE_SAMPLE) {
    if (token === 'expired') throw new Error('This reset link is invalid or has expired')
    sampleSession(null)
    return
  }
  await api.post('/auth/reset-password', { token, password })
  setTokens(null)
}

export async function listMyReservations(account: CustomerAccount): Promise<PublicReservation[]> {
  if (USE_SAMPLE) {
    const mine = sampleCustomers
      .filter((c) => c.mobile_number === account.mobile_number)
      .map((c) => c.customer_id)
    const found = await Promise.all(
      sampleReservations
        .filter((r) => mine.includes(r.customer_id))
        .sort((a, b) => b.reservation_date.localeCompare(a.reservation_date))
        .map((r) => getReservationByCode(r.reference_code)),
    )
    return found.filter((r) => r !== null)
  }
  const res = await api.get('/my/reservations')
  return res.data.data
}
