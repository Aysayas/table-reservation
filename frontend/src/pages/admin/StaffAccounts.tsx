import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { Plus, Search, Users } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import ConfirmDialog from '@/components/ConfirmDialog'
import EmptyState from '@/components/EmptyState'
import Skeleton from '@/components/Skeleton'
import StaffDialog from '@/components/StaffDialog'
import { getMe } from '@/services/auth'
import { listUsers, roleNames, updateUser } from '@/services/users'
import type { User, UserRole } from '@/types/db'

const th = 'px-5 py-3.5 text-left text-xs font-bold tracking-label text-white/70 uppercase'
const td = 'text-brand-charcoal px-5 py-4 text-sm'
const smallButton =
  'pointer-coarse:min-h-11 inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors duration-200'
const dl = 'grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm'
const dt = 'text-brand-ink/70'
const dd = 'text-brand-charcoal text-right'

export default function StaffAccounts() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<UserRole | ''>('')
  const [dialog, setDialog] = useState<{ user: User | null } | null>(null)
  const [disabling, setDisabling] = useState<User | null>(null)
  const { data: me } = useQuery({
    queryKey: ['me', 'admin'],
    queryFn: () => getMe('admin'),
    retry: false,
  })
  const {
    data: users = [],
    isPending,
    error,
  } = useQuery({
    queryKey: ['users', role, search.trim()],
    placeholderData: keepPreviousData,
    queryFn: () => listUsers({ role: role || undefined, search }),
  })

  const toggle = useMutation({
    mutationFn: (u: User) =>
      updateUser(u.user_id, {
        full_name: u.full_name,
        email: u.email,
        role: u.role,
        is_active: !u.is_active,
      }),
    onSuccess: (u) => {
      toast.success(`${u.full_name} ${u.is_active ? 'enabled' : 'disabled'}`)
      setDisabling(null)
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (e) => toast.error(e.message),
  })

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="border-brand-line focus-within:border-brand-gold flex h-11 w-full max-w-xs items-center gap-2 rounded-lg border bg-white px-3">
          <Search className="text-brand-ink/70 size-4" />
          <span className="sr-only">Search</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email"
            className="w-full bg-transparent text-sm outline-none"
          />
        </label>
        <label>
          <span className="sr-only">Role</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole | '')}
            className="border-brand-line focus:border-brand-gold h-11 rounded-lg border bg-white px-3 text-sm outline-none"
          >
            <option value="">All Roles</option>
            {Object.entries(roleNames).map(([value, name]) => (
              <option key={value} value={value}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => setDialog({ user: null })}
          className="bg-brand-red hover:bg-brand-red/90 lift ml-auto flex h-11 items-center gap-2 rounded-lg px-5 text-sm font-bold text-white transition-colors duration-200"
        >
          <Plus className="size-4" />
          Add Staff
        </button>
      </div>

      {error && <p className="text-brand-red mt-4 text-sm">{error.message}</p>}

      <div className="border-brand-line shadow-soft mt-5 overflow-x-auto rounded-xl border bg-white">
        <ul className="divide-brand-line divide-y md:hidden">
          {users.map((u) => {
            const isSelf = u.user_id === me?.user_id
            return (
              <li key={u.user_id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-brand-charcoal font-semibold">
                    {u.full_name}
                    {isSelf && <span className="text-brand-ink/70 ml-2 text-xs">(you)</span>}
                  </p>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${u.is_active ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-ink/10 text-brand-ink'}`}
                  >
                    {u.is_active ? 'Active' : 'Disabled'}
                  </span>
                </div>
                <dl className={dl}>
                  <dt className={dt}>Email</dt>
                  <dd className={`${dd} break-all`}>{u.email}</dd>
                  <dt className={dt}>Role</dt>
                  <dd className={dd}>{roleNames[u.role]}</dd>
                  <dt className={dt}>Last Login</dt>
                  <dd className={`${dd} tabular-nums`}>
                    {u.last_login_at ? format(parseISO(u.last_login_at), 'MMMM d, yyyy') : 'Never'}
                  </dd>
                </dl>
                <div className="flex gap-2 *:flex-1">
                  <button
                    type="button"
                    aria-label={`Edit ${u.email}`}
                    onClick={() => setDialog({ user: u })}
                    className={`${smallButton} border-brand-charcoal text-brand-charcoal hover:bg-brand-charcoal hover:text-white`}
                  >
                    Edit
                  </button>
                  {!isSelf && (
                    <button
                      type="button"
                      aria-label={`${u.is_active ? 'Disable' : 'Enable'} ${u.email}`}
                      disabled={toggle.isPending}
                      onClick={() => (u.is_active ? setDisabling(u) : toggle.mutate(u))}
                      className={`${smallButton} ${u.is_active ? 'border-brand-red text-brand-red hover:bg-brand-red' : 'border-brand-green text-brand-green hover:bg-brand-green'} hover:text-white disabled:opacity-50`}
                    >
                      {u.is_active ? 'Disable' : 'Enable'}
                    </button>
                  )}
                </div>
              </li>
            )
          })}
          {isPending &&
            Array.from({ length: 5 }, (_, i) => (
              <li key={i} className="space-y-3 p-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-full" />
              </li>
            ))}
        </ul>
        <table className="hidden w-full md:table">
          <thead className="bg-brand-charcoal">
            <tr>
              {['Name', 'Email', 'Role', 'Status', 'Last Login', 'Actions'].map((h) => (
                <th key={h} className={th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isSelf = u.user_id === me?.user_id
              return (
                <tr
                  key={u.user_id}
                  className="border-brand-line/70 hover:bg-brand-cream/50 border-t transition-colors duration-150"
                >
                  <td className={`${td} font-semibold`}>
                    {u.full_name}
                    {isSelf && <span className="text-brand-ink/70 ml-2 text-xs">(you)</span>}
                  </td>
                  <td className={td}>{u.email}</td>
                  <td className={td}>{roleNames[u.role]}</td>
                  <td className={td}>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${u.is_active ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-ink/10 text-brand-ink'}`}
                    >
                      {u.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className={`${td} tabular-nums`}>
                    {u.last_login_at ? format(parseISO(u.last_login_at), 'MMMM d, yyyy') : 'Never'}
                  </td>
                  <td className={td}>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        aria-label={`Edit ${u.email}`}
                        onClick={() => setDialog({ user: u })}
                        className={`${smallButton} border-brand-charcoal text-brand-charcoal hover:bg-brand-charcoal hover:text-white`}
                      >
                        Edit
                      </button>
                      {!isSelf && (
                        <button
                          type="button"
                          aria-label={`${u.is_active ? 'Disable' : 'Enable'} ${u.email}`}
                          disabled={toggle.isPending}
                          onClick={() => (u.is_active ? setDisabling(u) : toggle.mutate(u))}
                          className={`${smallButton} ${u.is_active ? 'border-brand-red text-brand-red hover:bg-brand-red' : 'border-brand-green text-brand-green hover:bg-brand-green'} hover:text-white disabled:opacity-50`}
                        >
                          {u.is_active ? 'Disable' : 'Enable'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
            {isPending &&
              Array.from({ length: 5 }, (_, i) => (
                <tr key={i} className="border-brand-line border-t">
                  {Array.from({ length: 6 }, (_, j) => (
                    <td key={j} className={td}>
                      <Skeleton className="h-4 w-full max-w-28" />
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
        {!isPending && users.length === 0 && (
          <EmptyState icon={Users} title="No staff accounts match." />
        )}
      </div>

      {disabling && (
        <ConfirmDialog
          title={`Disable ${disabling.full_name}?`}
          body="They won't be able to log in until you enable the account again."
          confirmLabel="Disable"
          closeLabel="Cancel"
          busy={toggle.isPending}
          onConfirm={() => toggle.mutate(disabling)}
          onClose={() => setDisabling(null)}
        />
      )}

      {dialog && (
        <StaffDialog
          user={dialog.user}
          isSelf={!!dialog.user && dialog.user.user_id === me?.user_id}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  )
}
