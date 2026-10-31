import { api, fileUrl, USE_SAMPLE } from '@/lib/api'
import { sampleOpeningHours, sampleSettings } from '@/services/sampleData'
import type { OpeningHours, RestaurantSettings } from '@/types/db'

export async function getSettings(): Promise<RestaurantSettings> {
  if (USE_SAMPLE) {
    return sampleSettings
  }
  const res = await api.get('/settings')
  return { ...res.data.data, logo_url: fileUrl(res.data.data.logo_url) }
}

export async function getOpeningHours(): Promise<OpeningHours[]> {
  if (USE_SAMPLE) {
    return sampleOpeningHours
  }
  const res = await api.get('/opening-hours')
  return res.data.data
}

export type SettingsInput = Partial<
  Pick<
    RestaurantSettings,
    | 'restaurant_name'
    | 'address'
    | 'contact_number'
    | 'email'
    | 'facebook_url'
    | 'slot_minutes'
    | 'max_pax'
    | 'booking_open_time'
    | 'deposit_required'
    | 'deposit_per_guest'
  >
>

export async function updateSettings(body: SettingsInput): Promise<RestaurantSettings> {
  if (USE_SAMPLE) {
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
  const res = await api.put('/settings', body)
  return res.data.data
}

export async function uploadLogo(logo: File): Promise<RestaurantSettings> {
  if (USE_SAMPLE) {
    if (!['image/jpeg', 'image/png'].includes(logo.type)) throw new Error('Use a PNG or JPG logo')
    if (logo.size > 2 * 1024 * 1024) throw new Error('Use a logo up to 2 MB')
    sampleSettings.logo_url = URL.createObjectURL(logo)
    return { ...sampleSettings }
  }
  const form = new FormData()
  form.append('logo', logo)
  const res = await api.post('/settings/logo', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return { ...res.data.data, logo_url: fileUrl(res.data.data.logo_url) }
}

export async function updateOpeningHours(hours: OpeningHours[]): Promise<OpeningHours[]> {
  if (USE_SAMPLE) {
    for (const h of hours) {
      if (h.is_open && (!h.open_time || !h.close_time || h.open_time >= h.close_time)) {
        throw new Error('An open day needs an opening time before its closing time')
      }
    }
    sampleOpeningHours.splice(0, 7, ...[...hours].sort((a, b) => a.day_of_week - b.day_of_week))
    return sampleOpeningHours
  }
  const res = await api.put('/opening-hours', hours)
  return res.data.data
}
