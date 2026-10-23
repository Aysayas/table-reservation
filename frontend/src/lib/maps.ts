const place = (restaurantName = '') => encodeURIComponent(`${restaurantName} Hotel and Restaurant`)

export const mapEmbedUrl = (restaurantName?: string) =>
  `https://maps.google.com/maps?q=${place(restaurantName)}&output=embed`

export const directionsUrl = (restaurantName?: string) =>
  `https://www.google.com/maps/dir/?api=1&destination=${place(restaurantName)}`
