import { sampleCategories, sampleMenuItems, sampleOrderItems } from '@/services/sampleData'
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

const findItem = (item_id: number) => {
  const item = sampleMenuItems.find((m) => m.item_id === item_id)
  if (!item) throw new Error('Menu item not found')
  return item
}

export async function setAvailability(item_id: number, is_available: boolean): Promise<MenuItem> {
  const item = findItem(item_id)
  item.is_available = is_available
  return { ...item }
}

export async function deleteMenuItem(item_id: number): Promise<void> {
  findItem(item_id)
  if (sampleOrderItems.some((i) => i.item_id === item_id)) {
    throw new Error('This dish has been ordered before. Turn off Available instead.')
  }
  sampleMenuItems.splice(
    sampleMenuItems.findIndex((m) => m.item_id === item_id),
    1,
  )
}

export type MenuItemInput = Omit<MenuItem, 'item_id' | 'image_url'>

export async function createMenuItem(body: MenuItemInput): Promise<MenuItem> {
  const item: MenuItem = {
    ...body,
    item_id: Math.max(0, ...sampleMenuItems.map((m) => m.item_id)) + 1,
    image_url: null,
  }
  sampleMenuItems.push(item)
  return { ...item }
}

export async function updateMenuItem(item_id: number, body: MenuItemInput): Promise<MenuItem> {
  const item = findItem(item_id)
  Object.assign(item, body)
  return { ...item }
}

export async function uploadMenuImage(item_id: number, photo: File): Promise<MenuItem> {
  if (!['image/jpeg', 'image/png'].includes(photo.type)) throw new Error('Use a JPG or PNG photo')
  if (photo.size > 2 * 1024 * 1024) throw new Error('Use a photo up to 2 MB')
  const item = findItem(item_id)
  item.image_url = URL.createObjectURL(photo)
  return { ...item }
}
