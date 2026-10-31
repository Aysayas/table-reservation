import { useQuery } from '@tanstack/react-query'
import { getAccount } from '@/services/account'

export default function useAccount() {
  return useQuery({ queryKey: ['account'], queryFn: getAccount, retry: false })
}
