import { sampleUsers } from '@/services/sampleData'
import type { User, UserRole } from '@/types/db'

export async function getMe(role: UserRole): Promise<User | undefined> {
  return sampleUsers.find((u) => u.role === role && u.is_active)
}
