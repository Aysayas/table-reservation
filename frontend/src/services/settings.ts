import { sampleOpeningHours, sampleSettings } from '@/services/sampleData'
import type { OpeningHours, RestaurantSettings } from '@/types/db'

export async function getSettings(): Promise<RestaurantSettings> {
  return sampleSettings
}

export async function getOpeningHours(): Promise<OpeningHours[]> {
  return sampleOpeningHours
}
