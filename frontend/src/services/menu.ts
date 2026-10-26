import { sampleCategories, sampleMenuItems, sampleOrderItems } from '@/services/sampleData'
import type { Category, MenuItem } from '@/types/db'

export type CategoryWithCount = Category & { item_count: number }

export async function getCategories(): Promise<CategoryWithCount[]> {
  return [...sampleCategories]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((c) => ({
      ...c,
      item_count: sampleMenuItems.filter((m) => m.category_id === c.category_id).length,
    }))
}

export type CategoryInput = { name: string; sort_order?: number }

const checkName = (name: string, except?: number) => {
  const taken = sampleCategories.some(
    (c) => c.category_id !== except && c.name.toLowerCase() === name.trim().toLowerCase(),
  )
  if (taken) throw new Error('A category with that name already exists')
}

const findCategory = (category_id: number) => {
  const category = sampleCategories.find((c) => c.category_id === category_id)
  if (!category) throw new Error('Category not found')
  return category
}

export async function createCategory(body: CategoryInput): Promise<Category> {
  checkName(body.name)
  const category: Category = {
    category_id: Math.max(0, ...sampleCategories.map((c) => c.category_id)) + 1,
    name: body.name.trim(),
    sort_order: body.sort_order ?? Math.max(0, ...sampleCategories.map((c) => c.sort_order)) + 1,
  }
  sampleCategories.push(category)
  return { ...category }
}

export async function updateCategory(category_id: number, body: CategoryInput): Promise<Category> {
  const category = findCategory(category_id)
  checkName(body.name, category_id)
  category.name = body.name.trim()
  if (body.sort_order !== undefined) category.sort_order = body.sort_order
  return { ...category }
}

export async function deleteCategory(category_id: number): Promise<void> {
  findCategory(category_id)
  if (sampleMenuItems.some((m) => m.category_id === category_id)) {
    throw new Error('This category still has dishes. Move or delete them first.')
  }
  sampleCategories.splice(
    sampleCategories.findIndex((c) => c.category_id === category_id),
    1,
  )
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
