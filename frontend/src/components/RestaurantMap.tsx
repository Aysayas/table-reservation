import { mapEmbedUrl } from '@/lib/maps'
import type { RestaurantSettings } from '@/types/db'

type Props = {
  settings: RestaurantSettings | undefined
  className: string
}

export default function RestaurantMap({ settings, className }: Props) {
  if (!settings) {
    return <div role="img" aria-label="Map" className={`${className} bg-neutral-200`} />
  }

  return (
    <iframe
      title={`Map to ${settings.restaurant_name}`}
      src={mapEmbedUrl(settings.restaurant_name)}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      className={`${className} border-brand-line w-full border`}
    />
  )
}
