import { api, setTokens, USE_SAMPLE } from '@/lib/api'
import { sampleUsers } from '@/services/sampleData'
import type { User, UserRole } from '@/types/db'

export async function login(email: string, password: string): Promise<User> {
  if (USE_SAMPLE) {
    const user = sampleUsers.find((u) => u.email === email && u.is_active)
    return user ?? sampleUsers.find((u) => u.role === 'staff' && u.is_active)!
  }
  const res = await api.post('/auth/login', { email, password })
  setTokens(res.data.data.access_token, res.data.data.refresh_token)
  return res.data.data.user
}

export const roleHome = (role: UserRole | 'customer') =>
  role === 'customer'
    ? '/'
    : role === 'admin'
      ? '/admin'
      : role === 'kitchen'
        ? '/kitchen'
        : '/staff'

export async function logout(): Promise<void> {
  if (USE_SAMPLE) return
  const refresh_token = localStorage.getItem('refresh_token')
  try {
    if (refresh_token) await api.post('/auth/logout', { refresh_token })
  } finally {
    setTokens(null)
  }
}

export async function getMe(role: UserRole): Promise<User | null> {
  if (USE_SAMPLE) return sampleUsers.find((u) => u.role === role && u.is_active) ?? null
  const res = await api.get('/auth/me')
  return res.data.data
}
