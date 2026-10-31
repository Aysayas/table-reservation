import { api, USE_SAMPLE } from '@/lib/api'
import { sampleUsers } from '@/services/sampleData'
import type { User, UserRole } from '@/types/db'

export const roleNames: Record<UserRole, string> = {
  admin: 'Admin',
  staff: 'Staff',
  kitchen: 'Kitchen',
}

export type UserFilter = { role?: UserRole; search?: string }

export type UserInput = {
  full_name: string
  email: string
  role: UserRole
  password?: string
  is_active?: boolean
}

const checkEmail = (email: string, user_id?: number) => {
  const taken = sampleUsers.some(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.user_id !== user_id,
  )
  if (taken) throw new Error('That email is already used by another account')
}

export async function listUsers(filter: UserFilter): Promise<User[]> {
  const search = filter.search?.trim() || undefined
  if (!USE_SAMPLE) {
    const res = await api.get('/users', { params: { role: filter.role, search } })
    return res.data.data
  }
  const term = search?.toLowerCase() ?? ''
  return sampleUsers
    .filter((u) => !filter.role || u.role === filter.role)
    .filter((u) => !term || u.full_name.toLowerCase().includes(term) || u.email.includes(term))
    .sort((a, b) => a.full_name.localeCompare(b.full_name))
    .map((u) => ({ ...u }))
}

export async function createUser(body: UserInput): Promise<User> {
  if (!USE_SAMPLE) {
    const res = await api.post('/users', body)
    return res.data.data
  }
  checkEmail(body.email)
  const user: User = {
    user_id: Math.max(0, ...sampleUsers.map((u) => u.user_id)) + 1,
    full_name: body.full_name.trim(),
    email: body.email.trim().toLowerCase(),
    role: body.role,
    is_active: true,
    last_login_at: null,
    created_at: new Date().toISOString().slice(0, 19),
  }
  sampleUsers.push(user)
  return { ...user }
}

export async function updateUser(user_id: number, body: UserInput): Promise<User> {
  if (!USE_SAMPLE) {
    const res = await api.put(`/users/${user_id}`, body)
    return res.data.data
  }
  const user = sampleUsers.find((u) => u.user_id === user_id)
  if (!user) throw new Error('Staff account not found')
  checkEmail(body.email, user_id)
  user.full_name = body.full_name.trim()
  user.email = body.email.trim().toLowerCase()
  user.role = body.role
  if (body.is_active !== undefined) user.is_active = body.is_active
  return { ...user }
}
