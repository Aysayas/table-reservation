import { sampleCategories, sampleMenuItems } from '@/services/sampleData'
import type { Category, MenuItem } from '@/types/db'

export async function getCategories(): Promise<Category[]> {
  return [...sampleCategories].sort((a, b) => a.sort_order - b.sort_order)
}

export async function getMenuItems(categoryId?: number): Promise<MenuItem[]> {
  return categoryId
    ? sampleMenuItems.filter((item) => item.category_id === categoryId)
    : sampleMenuItems
}

export async function getMenuItem(itemId: number): Promise<MenuItem | undefined> {
  return sampleMenuItems.find((item) => item.item_id === itemId)
}
