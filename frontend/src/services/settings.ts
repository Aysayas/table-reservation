import { sampleOpeningHours, sampleSettings } from '@/services/sampleData'
import type { OpeningHours, RestaurantSettings } from '@/types/db'

export async function getSettings(): Promise<RestaurantSettings> {
  return sampleSettings
}

export async function getOpeningHours(): Promise<OpeningHours[]> {
  return sampleOpeningHours
}

export type SettingsInput = Partial<
  Pick<RestaurantSettings, 'slot_minutes' | 'max_pax' | 'deposit_required' | 'deposit_per_guest'>
>

export async function updateSettings(body: SettingsInput): Promise<RestaurantSettings> {
  const { slot_minutes, max_pax, deposit_per_guest } = body
  if (slot_minutes !== undefined && (slot_minutes < 15 || slot_minutes > 240)) {
    throw new Error('Time slots must be 15 to 240 minutes')
  }
  if (max_pax !== undefined && (max_pax < 1 || max_pax > 100)) {
    throw new Error('Max guests must be 1 to 100')
  }
  if (deposit_per_guest !== undefined && deposit_per_guest < 0) {
    throw new Error('The deposit cannot be negative')
  }
  Object.assign(sampleSettings, body)
  return { ...sampleSettings }
}
