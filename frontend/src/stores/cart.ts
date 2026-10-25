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
  setQuantity: (line: CartLine, quantity: number) => void
  remove: (line: CartLine) => void
  clear: () => void
}

const sameLine = (a: CartLine, b: CartLine) => a.item_id === b.item_id && a.notes === b.notes

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      tableId: null,
      lines: [],
      add: (tableId, line) =>
        set((state) => {
          const lines = state.tableId === tableId ? state.lines : []
          const same = lines.find((l) => sameLine(l, line))
          return {
            tableId,
            lines: same
              ? lines.map((l) =>
                  l === same ? { ...l, quantity: Math.min(99, l.quantity + line.quantity) } : l,
                )
              : [...lines, line],
          }
        }),
      setQuantity: (line, quantity) =>
        set((state) => ({
          lines: state.lines.map((l) =>
            sameLine(l, line) ? { ...l, quantity: Math.min(99, Math.max(1, quantity)) } : l,
          ),
        })),
      remove: (line) => set((state) => ({ lines: state.lines.filter((l) => !sameLine(l, line)) })),
      clear: () => set({ lines: [] }),
    }),
    { name: 'cart', storage: createJSONStorage(() => sessionStorage) },
  ),
)

export const cartCount = (lines: CartLine[]) => lines.reduce((n, l) => n + l.quantity, 0)
export const cartTotal = (lines: CartLine[]) => lines.reduce((n, l) => n + l.price * l.quantity, 0)
