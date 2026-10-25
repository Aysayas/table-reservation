import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type CartLine = {
  item_id: number
  name: string
  price: number
  quantity: number
  notes: string
}

type CartState = {
  tableId: number | null
  lines: CartLine[]
  add: (tableId: number, line: CartLine) => void
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      tableId: null,
      lines: [],
      add: (tableId, line) =>
        set((state) => {
          const lines = state.tableId === tableId ? state.lines : []
          const same = lines.find((l) => l.item_id === line.item_id && l.notes === line.notes)
          return {
            tableId,
            lines: same
              ? lines.map((l) => (l === same ? { ...l, quantity: l.quantity + line.quantity } : l))
              : [...lines, line],
          }
        }),
    }),
    { name: 'cart', storage: createJSONStorage(() => sessionStorage) },
  ),
)

export const cartCount = (lines: CartLine[]) => lines.reduce((n, l) => n + l.quantity, 0)
export const cartTotal = (lines: CartLine[]) => lines.reduce((n, l) => n + l.price * l.quantity, 0)
