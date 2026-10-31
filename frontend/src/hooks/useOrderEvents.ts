import { useQueryClient, type QueryKey } from '@tanstack/react-query'
import Pusher from 'pusher-js'
import { useEffect, useRef } from 'react'
import { getToken, USE_SAMPLE } from '@/lib/api'

export const STAFF_CHANNEL = 'private-orders'

const events = ['order.created', 'order.status', 'order.paid']
const key = import.meta.env.VITE_PUSHER_KEY
let client: Pusher | null = null

function pusher() {
  if (USE_SAMPLE || !key) return null
  client ??= new Pusher(key, {
    cluster: import.meta.env.VITE_PUSHER_CLUSTER ?? '',
    channelAuthorization: {
      endpoint: `${import.meta.env.VITE_API_URL}/realtime/auth`,
      transport: 'ajax',
      headersProvider: () => ({ Authorization: `Bearer ${getToken() ?? ''}` }),
    },
  })
  return client
}

export default function useOrderEvents(channel: string | null | undefined, queryKey: QueryKey) {
  const queryClient = useQueryClient()
  const latestKey = useRef(queryKey)
  useEffect(() => {
    latestKey.current = queryKey
  })

  useEffect(() => {
    const p = pusher()
    if (!p || !channel) return
    const subscription = p.subscribe(channel)
    const refresh = () => queryClient.invalidateQueries({ queryKey: latestKey.current })
    for (const event of events) subscription.bind(event, refresh)
    return () => {
      for (const event of events) subscription.unbind(event, refresh)
      p.unsubscribe(channel)
    }
  }, [channel, queryClient])
}
