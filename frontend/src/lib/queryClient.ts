import { QueryCache, QueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { toast } from 'sonner'

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (
        query.state.data !== undefined &&
        /^\/(admin|staff|kitchen)/.test(window.location.pathname) &&
        !(axios.isAxiosError(error) && error.response?.status === 401)
      )
        toast.error("Couldn't refresh. Showing the last saved data.", { id: 'refresh-failed' })
    },
  }),
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
