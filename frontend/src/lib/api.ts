import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

const TOKEN_KEY = 'access_token'
const REFRESH_KEY = 'refresh_token'

export const USE_SAMPLE = import.meta.env.VITE_USE_SAMPLE === 'true'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let refreshing: Promise<string | null> | null = null

function refreshToken(): Promise<string | null> {
  const refresh_token = localStorage.getItem(REFRESH_KEY)
  if (!refresh_token) return Promise.resolve(null)
  refreshing ??= axios
    .post(`${import.meta.env.VITE_API_URL}/auth/refresh`, { refresh_token })
    .then((res) => {
      setTokens(res.data.data.access_token, res.data.data.refresh_token)
      return res.data.data.access_token as string
    })
    .catch(() => null)
    .finally(() => {
      refreshing = null
    })
  return refreshing
}

api.interceptors.response.use(undefined, async (error: AxiosError) => {
  const config = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined
  const isAuthCall = config?.url?.startsWith('/auth/')
  if (error.response?.status !== 401 || !config || config._retried || isAuthCall) {
    throw readable(error)
  }
  config._retried = true
  const token = await refreshToken()
  if (!token) {
    setTokens(null)
    if (
      window.location.pathname.match(/^\/(staff|kitchen|admin)/) &&
      window.location.pathname !== '/staff/login'
    ) {
      window.location.assign('/staff/login')
    }
    throw readable(error)
  }
  config.headers.Authorization = `Bearer ${token}`
  return api(config)
})

export function setTokens(token: string | null, refresh?: string) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh)
  else if (!token) localStorage.removeItem(REFRESH_KEY)
}

export function apiError(error: unknown, fallback = 'Something went wrong. Please try again.') {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string; errors?: string[] } | undefined
    return data?.errors?.join(' ') || data?.error || fallback
  }
  return error instanceof Error ? error.message : fallback
}

function readable(error: AxiosError) {
  error.message = apiError(error, error.message)
  return error
}
