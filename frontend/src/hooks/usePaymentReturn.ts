import { useEffect, useState } from 'react'

const waitMs = 30000

const read = (key: string) => {
  try {
    return sessionStorage.getItem(`paying:${key}`) !== null
  } catch {
    return false
  }
}

export function markPaying(key: string) {
  try {
    sessionStorage.setItem(`paying:${key}`, '1')
  } catch {
    return
  }
}

export function clearPaying(key: string) {
  try {
    sessionStorage.removeItem(`paying:${key}`)
  } catch {
    return
  }
}

export default function usePaymentReturn(key: string, settled: boolean) {
  const [waiting, setWaiting] = useState(() => read(key))
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    if (!waiting) return
    if (settled) {
      clearPaying(key)
      return
    }
    const timer = setTimeout(() => {
      clearPaying(key)
      setWaiting(false)
      setTimedOut(true)
    }, waitMs)
    return () => clearTimeout(timer)
  }, [key, settled, waiting])

  return {
    confirming: waiting && !settled,
    paidOnReturn: waiting && settled,
    timedOut: timedOut && !settled,
  }
}
