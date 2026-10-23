import type { OpeningHours } from '@/types/db'

export const dayNames = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]
export const weekOrder = [1, 2, 3, 4, 5, 6, 0]

export function formatTime(time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  const suffix = hours < 12 ? 'AM' : 'PM'
  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${suffix}`
}

export function hoursText(entry: OpeningHours | undefined) {
  return entry?.is_open && entry.open_time && entry.close_time
    ? `${formatTime(entry.open_time)} – ${formatTime(entry.close_time)}`
    : 'Closed'
}

export function groupHours(hours: OpeningHours[]) {
  const groups: { days: string; time: string }[] = []
  let first = ''
  let last = ''
  weekOrder.forEach((day, index) => {
    const time = hoursText(hours.find((h) => h.day_of_week === day))
    const next = weekOrder[index + 1]
    const nextTime =
      next === undefined ? undefined : hoursText(hours.find((h) => h.day_of_week === next))
    first = first || dayNames[day]
    last = dayNames[day]
    if (time !== nextTime) {
      groups.push({ days: first === last ? first : `${first} – ${last}`, time })
      first = ''
    }
  })
  return groups
}
