import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { differenceInMinutes, format, parseISO } from 'date-fns'
import { ArrowLeft, ChefHat, LogOut, Maximize, Minimize, Volume2, VolumeX } from 'lucide-react'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import EmptyState from '@/components/EmptyState'
import LoadError from '@/components/LoadError'
import Skeleton from '@/components/Skeleton'
import Spinner from '@/components/Spinner'
import useOrderEvents, { STAFF_CHANNEL } from '@/hooks/useOrderEvents'
import { logout } from '@/services/auth'
import { listOrders, updateOrderStatus, type StaffOrder } from '@/services/orders'
import type { OrderStatus } from '@/types/db'

const columns = [
  {
    status: 'received',
    title: 'Received',
    next: 'preparing',
    action: 'Start Preparing',
    top: 'border-t-brand-ink/40',
    count: 'bg-brand-ink/10 text-brand-ink',
    button:
      'border-brand-charcoal text-brand-charcoal hover:bg-brand-charcoal border-2 bg-white hover:text-white',
  },
  {
    status: 'preparing',
    title: 'Preparing',
    next: 'ready',
    action: 'Mark Ready',
    top: 'border-t-brand-gold',
    count: 'bg-brand-gold/20 text-brand-gold-deep',
    button: 'bg-brand-charcoal hover:bg-brand-charcoal/90 text-white',
  },
  {
    status: 'ready',
    title: 'Ready',
    next: 'served',
    action: 'Mark Served',
    top: 'border-t-brand-red',
    count: 'bg-brand-red text-white',
    button: 'bg-brand-red hover:bg-brand-red/90 text-white',
  },
] as const satisfies {
  status: OrderStatus
  title: string
  next: OrderStatus
  action: string
  top: string
  count: string
  button: string
}[]

const ages = [
  { label: 'On time', chip: 'bg-brand-green/10 text-brand-green', bar: 'bg-brand-green' },
  { label: '10+ min', chip: 'bg-brand-gold/20 text-brand-gold-deep', bar: 'bg-brand-gold' },
  { label: '15+ min', chip: 'bg-brand-red/10 text-brand-red', bar: 'bg-brand-red' },
]
const headerButton =
  'flex items-center gap-2 text-sm text-white/70 transition-colors duration-200 hover:text-white pointer-coarse:min-h-11'
const kitchenKey = ['orders', 'kitchen']
const moveKey = ['kitchen-move']
const ticksKey = 'kitchen-ticks'

const chime = (ctx: AudioContext) => {
  void ctx.resume()
  ;[660, 880].forEach((frequency, i) => {
    const start = ctx.currentTime + i * 0.18
    const tone = ctx.createOscillator()
    const volume = ctx.createGain()
    tone.frequency.value = frequency
    volume.gain.setValueAtTime(0.0001, start)
    volume.gain.exponentialRampToValueAtTime(0.06, start + 0.02)
    volume.gain.exponentialRampToValueAtTime(0.0001, start + 0.15)
    tone.connect(volume).connect(ctx.destination)
    tone.start(start)
    tone.stop(start + 0.16)
  })
}

const ageOf = (minutes: number) => ages[minutes >= 15 ? 2 : minutes >= 10 ? 1 : 0]
const waited = (minutes: number) =>
  minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`

const onFullscreenChange = (change: () => void) => {
  document.addEventListener('fullscreenchange', change)
  return () => document.removeEventListener('fullscreenchange', change)
}

const readTicks = () => {
  try {
    return new Set<number>(JSON.parse(sessionStorage.getItem(ticksKey) ?? '[]'))
  } catch {
    return new Set<number>()
  }
}

export default function KitchenDisplay() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const from = (useLocation().state as { from?: string } | null)?.from
  const signOut = async (e: React.MouseEvent) => {
    e.preventDefault()
    await logout().catch(() => undefined)
    navigate('/staff/login')
  }
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(id)
  }, [])
  const {
    data: orders = [],
    isPending,
    isSuccess,
    isLoadingError,
    refetch,
  } = useQuery({
    queryKey: kitchenKey,
    queryFn: () => listOrders({ status: ['received', 'preparing', 'ready'] }),
    refetchInterval: 15000,
  })
  useOrderEvents(STAFF_CHANNEL, ['orders'])
  const [sound, setSound] = useState(() => {
    try {
      return localStorage.getItem('kitchen-sound') === 'on'
    } catch {
      return false
    }
  })
  const audio = useRef<AudioContext | null>(null)
  const timers = useRef<number[]>([])
  useEffect(() => {
    if (!sound) return
    const unlock = () => void (audio.current ??= new AudioContext()).resume()
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [sound])
  useEffect(
    () => () => {
      for (const timer of timers.current) clearTimeout(timer)
      void audio.current?.close()
      audio.current = null
    },
    [],
  )
  useEffect(() => {
    let lock: WakeLockSentinel | undefined
    let active = true
    const hold = async () => {
      if (document.visibilityState !== 'visible' || !('wakeLock' in navigator)) return
      try {
        const next = await navigator.wakeLock.request('screen')
        if (active) lock = next
        else void next.release()
      } catch {
        return
      }
    }
    void hold()
    document.addEventListener('visibilitychange', hold)
    return () => {
      active = false
      document.removeEventListener('visibilitychange', hold)
      void lock?.release()
    }
  }, [])
  const fullscreen = useSyncExternalStore(onFullscreenChange, () => !!document.fullscreenElement)
  const toggleFullscreen = () => {
    const change = document.fullscreenElement
      ? document.exitFullscreen()
      : document.documentElement.requestFullscreen?.()
    change?.catch(() => toast.error("Full screen isn't available on this device."))
  }
  const toggleSound = () => {
    const next = !sound
    setSound(next)
    if (next) chime((audio.current ??= new AudioContext()))
    try {
      localStorage.setItem('kitchen-sound', next ? 'on' : 'off')
    } catch {
      return
    }
  }
  const [ticks, setTicks] = useState(readTicks)
  const changeTicks = (change: (next: Set<number>) => void) =>
    setTicks((previous) => {
      const next = new Set(previous)
      change(next)
      try {
        sessionStorage.setItem(ticksKey, JSON.stringify([...next]))
      } catch {
        return next
      }
      return next
    })
  const toggleTick = (id: number) =>
    changeTicks((next) => {
      if (!next.delete(id)) next.add(id)
    })
  const seen = useRef<Set<number> | null>(null)
  const [fresh, setFresh] = useState<number[]>([])
  const [announcement, setAnnouncement] = useState('')
  useEffect(() => {
    if (!isSuccess) return
    if (!seen.current) {
      seen.current = new Set(orders.map((o) => o.order_id))
      return
    }
    const known = seen.current
    const arrived = orders.filter((o) => o.status === 'received' && !known.has(o.order_id))
    for (const o of orders) known.add(o.order_id)
    if (arrived.length === 0) return
    const ids = arrived.map((o) => o.order_id)
    for (const o of arrived) toast.info('New order', { description: `Table ${o.table_number}` })
    setAnnouncement(arrived.map((o) => `New order for table ${o.table_number}`).join('. '))
    setFresh((list) => [...list, ...ids])
    timers.current.push(
      window.setTimeout(() => setFresh((list) => list.filter((id) => !ids.includes(id))), 4000),
    )
    if (sound) chime((audio.current ??= new AudioContext()))
  }, [orders, isSuccess, sound])
  const [saving, setSaving] = useState<number[]>([])
  const savingIds = useRef(new Set<number>())
  const move = useMutation({
    mutationKey: moveKey,
    mutationFn: ({ order, next }: { order: StaffOrder; next: OrderStatus }) =>
      updateOrderStatus(order.order_id, next),
    onMutate: async ({ order, next }) => {
      const itemIds = order.items.map((item) => item.order_item_id)
      changeTicks((left) => {
        for (const id of itemIds) left.delete(id)
      })
      await queryClient.cancelQueries({ queryKey: kitchenKey })
      const previous = queryClient
        .getQueryData<StaffOrder[]>(kitchenKey)
        ?.find((o) => o.order_id === order.order_id)?.status
      queryClient.setQueryData<StaffOrder[]>(kitchenKey, (list = []) =>
        previous
          ? list.map((o) => (o.order_id === order.order_id ? { ...o, status: next } : o))
          : [{ ...order, status: next }, ...list],
      )
      return { previous }
    },
    onSuccess: (updated, { order }) => {
      toast.success(
        `Order #${updated.order_id} is now ${updated.status}`,
        updated.status === 'served'
          ? { action: { label: 'Undo', onClick: () => bump(order, 'ready') } }
          : undefined,
      )
    },
    onError: (e, { order }, context) => {
      queryClient.setQueryData<StaffOrder[]>(kitchenKey, (list = []) =>
        context?.previous
          ? list.map((o) =>
              o.order_id === order.order_id ? { ...o, status: context.previous! } : o,
            )
          : list.filter((o) => o.order_id !== order.order_id),
      )
      toast.error(e.message)
    },
    onSettled: (_data, _error, { order }) => {
      savingIds.current.delete(order.order_id)
      setSaving((list) => list.filter((id) => id !== order.order_id))
      if (queryClient.isMutating({ mutationKey: moveKey }) > 1) return
      for (const key of ['orders', 'tables', 'dashboard']) {
        queryClient.invalidateQueries({ queryKey: [key] })
      }
    },
  })
  const bump = (order: StaffOrder, next: OrderStatus) => {
    if (savingIds.current.has(order.order_id)) return
    savingIds.current.add(order.order_id)
    setSaving((list) => [...list, order.order_id])
    move.mutate({ order, next })
  }
  const oldestFirst = [...orders].reverse()
  const minutesOf = (order: StaffOrder) =>
    Math.max(0, differenceInMinutes(now, parseISO(order.created_at)))
  const late = orders.filter((o) => minutesOf(o) >= 15).length
  const average = orders.length
    ? Math.round(orders.reduce((sum, o) => sum + minutesOf(o), 0) / orders.length)
    : 0

  return (
    <div className="bg-brand-cream flex min-h-dvh flex-col md:h-dvh">
      <header className="bg-brand-charcoal flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5 text-white md:px-6">
        {from && (
          <Link to={from} className={headerButton}>
            <ArrowLeft className="size-4" />
            Back
          </Link>
        )}
        <h1 className="font-serif text-xl">Kitchen Display</h1>
        {!isPending && !isLoadingError && (
          <p className="text-sm text-white/75 tabular-nums">
            {orders.length} open ·{' '}
            <span className={late ? 'text-brand-red-light font-bold' : ''}>{late} late</span> · avg{' '}
            {average} min
          </p>
        )}
        <ul aria-label="Waiting time" className="hidden flex-wrap gap-3 xl:flex">
          {ages.map((age) => (
            <li key={age.label} className="flex items-center gap-1.5 text-xs text-white/75">
              <span className={`size-2 rounded-full ${age.bar}`} />
              {age.label}
            </li>
          ))}
        </ul>
        <p className="ml-auto font-serif text-lg tabular-nums">{format(now, 'h:mm a')}</p>
        <button type="button" aria-pressed={sound} onClick={toggleSound} className={headerButton}>
          {sound ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
          <span className="max-lg:sr-only">Sound</span>
        </button>
        {document.fullscreenEnabled && (
          <button type="button" onClick={toggleFullscreen} className={headerButton}>
            {fullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
            <span className="max-lg:sr-only">
              {fullscreen ? 'Exit full screen' : 'Full screen'}
            </span>
          </button>
        )}
        <Link to="/staff/login" onClick={signOut} className={headerButton}>
          <LogOut className="size-4" />
          <span className="max-lg:sr-only">Log Out</span>
        </Link>
      </header>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <main className="grid flex-1 gap-4 p-4 md:min-h-0 md:grid-cols-3 md:p-5">
        {isLoadingError ? (
          <div className="mx-auto mt-8 w-full max-w-md md:col-span-3">
            <LoadError what="the kitchen orders" onRetry={() => refetch()} />
          </div>
        ) : (
          columns.map((column) => {
            const list = oldestFirst.filter((o) => o.status === column.status)
            return (
              <section
                key={column.status}
                aria-labelledby={`col-${column.status}`}
                className={`border-brand-line flex flex-col rounded-xl border border-t-4 bg-white/50 md:min-h-0 ${column.top}`}
              >
                <h2
                  id={`col-${column.status}`}
                  className="text-brand-charcoal border-brand-line flex items-center justify-between border-b px-4 py-3 font-serif text-2xl"
                >
                  {column.title}
                  <span
                    aria-label={`(${list.length})`}
                    className={`grid size-8 place-items-center rounded-full font-sans text-sm font-bold ${column.count}`}
                  >
                    {list.length}
                  </span>
                </h2>
                <ul className="flex-1 space-y-3 p-3 md:overflow-y-auto">
                  {list.map((order) => {
                    const minutes = minutesOf(order)
                    const age = ageOf(minutes)
                    const busy = saving.includes(order.order_id)
                    return (
                      <li
                        key={order.order_id}
                        aria-label={`Order #${order.order_id}`}
                        className={`border-brand-line/60 rounded-xl border bg-white p-4 ${minutes >= 15 ? 'border-l-brand-red border-l-4' : ''} ${fresh.includes(order.order_id) ? 'ring-brand-gold ring-2 motion-safe:animate-pulse' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-brand-charcoal font-serif text-4xl leading-none font-bold">
                              <span className="sr-only">Table </span>
                              {order.table_number}
                            </p>
                            <p className="text-brand-ink/70 mt-1.5 text-sm">
                              Order #{order.order_id}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold tabular-nums ${age.chip}`}
                          >
                            {waited(minutes)}
                          </span>
                        </div>
                        <div
                          aria-hidden="true"
                          className="bg-brand-line/40 mt-3 h-1 overflow-hidden rounded-full"
                        >
                          <div
                            className={`h-full rounded-full ${age.bar}`}
                            style={{ width: `${Math.min(100, (minutes / 15) * 100)}%` }}
                          />
                        </div>
                        <ul className="mt-3 space-y-1">
                          {order.items.map((item) => {
                            const done = ticks.has(item.order_item_id)
                            return (
                              <li key={item.order_item_id}>
                                <button
                                  type="button"
                                  aria-pressed={done}
                                  onClick={() => toggleTick(item.order_item_id)}
                                  className={`hover:bg-brand-cream grid min-h-11 w-full grid-cols-[2.5rem_1fr] items-center rounded-lg px-1 text-left text-lg transition-colors duration-200 ${done ? 'text-brand-ink/50 line-through' : 'text-brand-charcoal'}`}
                                >
                                  <span className="font-bold">{item.quantity}×</span>
                                  {item.name}
                                </button>
                                {item.notes && (
                                  <p className="bg-brand-red/10 text-brand-red mt-1 ml-11 inline-block rounded-lg px-3 py-1 text-base font-bold">
                                    {item.notes}
                                  </p>
                                )}
                              </li>
                            )
                          })}
                        </ul>
                        <button
                          type="button"
                          disabled={busy}
                          aria-busy={busy}
                          onClick={() => bump(order, column.next)}
                          className={`mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg text-base font-bold tracking-wide transition-colors duration-200 disabled:opacity-50 ${column.button}`}
                        >
                          {busy && <Spinner />}
                          {column.action}
                        </button>
                      </li>
                    )
                  })}
                  {isPending &&
                    Array.from({ length: 2 }, (_, i) => (
                      <li key={i} className="border-brand-line/60 rounded-xl border bg-white p-4">
                        <Skeleton className="h-9 w-16" />
                        <Skeleton className="mt-2 h-4 w-20" />
                        <Skeleton className="mt-4 h-5 w-3/4" />
                        <Skeleton className="mt-2 h-5 w-1/2" />
                        <Skeleton className="mt-4 h-12 w-full" />
                      </li>
                    ))}
                  {!isPending && list.length === 0 && (
                    <li className="border-brand-line rounded-xl border border-dashed">
                      <EmptyState
                        icon={ChefHat}
                        title="No orders here. New orders appear automatically."
                      />
                    </li>
                  )}
                </ul>
              </section>
            )
          })
        )}
      </main>
    </div>
  )
}
