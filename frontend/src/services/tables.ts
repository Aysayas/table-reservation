import { sampleTables } from '@/services/sampleData'
import type { RestaurantTable } from '@/types/db'

export type PublicTable = Omit<RestaurantTable, 'qr_token'>

export async function getTable(tableId: number): Promise<PublicTable | undefined> {
  const table = sampleTables.find((t) => t.table_id === tableId)
  if (!table) return undefined
  return {
    table_id: table.table_id,
    table_number: table.table_number,
    capacity: table.capacity,
    status: table.status,
  }
}
