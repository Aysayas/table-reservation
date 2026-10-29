import axios from 'axios'
import { api, fileUrl, USE_SAMPLE } from '@/lib/api'
import { sampleCategories, sampleMenuItems, sampleOrderItems } from '@/services/sampleData'
import type { Category, MenuItem } from '@/types/db'

const withPhoto = (item: MenuItem) => ({ ...item, image_url: fileUrl(item.image_url) })

export type CategoryWithCount = Category & { item_count: number }

export async function getCategories(): Promise<CategoryWithCount[]> {
  if (USE_SAMPLE) {
    return [...sampleCategories]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((c) => ({
        ...c,
        item_count: sampleMenuItems.filter((m) => m.category_id === c.category_id).length,
      }))
  }
  const res = await api.get('/categories')
  return res.data.data
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
  if (USE_SAMPLE) {
    checkName(body.name)
    const category: Category = {
      category_id: Math.max(0, ...sampleCategories.map((c) => c.category_id)) + 1,
      name: body.name.trim(),
      sort_order: body.sort_order ?? Math.max(0, ...sampleCategories.map((c) => c.sort_order)) + 1,
    }
    sampleCategories.push(category)
    return { ...category }
  }
  const res = await api.post('/categories', body)
  return res.data.data
}

export async function updateCategory(category_id: number, body: CategoryInput): Promise<Category> {
  if (USE_SAMPLE) {
    const category = findCategory(category_id)
    checkName(body.name, category_id)
    category.name = body.name.trim()
    if (body.sort_order !== undefined) category.sort_order = body.sort_order
    return { ...category }
  }
  const res = await api.put(`/categories/${category_id}`, body)
  return res.data.data
}

export async function deleteCategory(category_id: number): Promise<void> {
  if (USE_SAMPLE) {
    findCategory(category_id)
    if (sampleMenuItems.some((m) => m.category_id === category_id)) {
      throw new Error('This category still has dishes. Move or delete them first.')
    }
    sampleCategories.splice(
      sampleCategories.findIndex((c) => c.category_id === category_id),
      1,
    )
    return
  }
  await api.delete(`/categories/${category_id}`)
}

export async function getMenuItems(categoryId?: number): Promise<MenuItem[]> {
  if (USE_SAMPLE) {
    return categoryId
      ? sampleMenuItems.filter((item) => item.category_id === categoryId)
      : sampleMenuItems
  }
  const res = await api.get('/menu-items', { params: { category_id: categoryId } })
  return res.data.data.map(withPhoto)
}

export async function getMenuItem(itemId: number): Promise<MenuItem | undefined> {
  if (USE_SAMPLE) {
    return sampleMenuItems.find((item) => item.item_id === itemId)
  }
  try {
    const res = await api.get(`/menu-items/${itemId}`)
    return withPhoto(res.data.data)
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return undefined
    throw error
  }
}

const findItem = (item_id: number) => {
  const item = sampleMenuItems.find((m) => m.item_id === item_id)
  if (!item) throw new Error('Menu item not found')
  return item
}

export async function setAvailability(item_id: number, is_available: boolean): Promise<MenuItem> {
  if (USE_SAMPLE) {
    const item = findItem(item_id)
    item.is_available = is_available
    return { ...item }
  }
  const res = await api.patch(`/menu-items/${item_id}/availability`, { is_available })
  return res.data.data
}

export async function deleteMenuItem(item_id: number): Promise<void> {
  if (USE_SAMPLE) {
    findItem(item_id)
    if (sampleOrderItems.some((i) => i.item_id === item_id)) {
      throw new Error('This dish has been ordered before. Turn off Available instead.')
    }
    sampleMenuItems.splice(
      sampleMenuItems.findIndex((m) => m.item_id === item_id),
      1,
    )
    return
  }
  await api.delete(`/menu-items/${item_id}`)
}

export type MenuItemInput = Omit<MenuItem, 'item_id' | 'image_url'>

export async function createMenuItem(body: MenuItemInput): Promise<MenuItem> {
  if (USE_SAMPLE) {
    const item: MenuItem = {
      ...body,
      item_id: Math.max(0, ...sampleMenuItems.map((m) => m.item_id)) + 1,
      image_url: null,
    }
    sampleMenuItems.push(item)
    return { ...item }
  }
  const res = await api.post('/menu-items', body)
  return res.data.data
}

export async function updateMenuItem(item_id: number, body: MenuItemInput): Promise<MenuItem> {
  if (USE_SAMPLE) {
    const item = findItem(item_id)
    Object.assign(item, body)
    return { ...item }
  }
  const res = await api.put(`/menu-items/${item_id}`, body)
  return res.data.data
}

export async function uploadMenuImage(item_id: number, photo: File): Promise<MenuItem> {
  if (USE_SAMPLE) {
    if (!['image/jpeg', 'image/png'].includes(photo.type)) throw new Error('Use a JPG or PNG photo')
    if (photo.size > 2 * 1024 * 1024) throw new Error('Use a photo up to 2 MB')
    const item = findItem(item_id)
    item.image_url = URL.createObjectURL(photo)
    return { ...item }
  }
  const form = new FormData()
  form.append('photo', photo)
  const res = await api.post(`/menu-items/${item_id}/image`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data.data
}

export async function getRecommendations(item_ids: number[] = [], limit = 4): Promise<MenuItem[]> {
  if (USE_SAMPLE) {
    const categories = new Set(
      sampleMenuItems.filter((m) => item_ids.includes(m.item_id)).map((m) => m.category_id),
    )
    return sampleMenuItems
      .filter(
        (m) =>
          m.is_available &&
          !item_ids.includes(m.item_id) &&
          (categories.has(m.category_id) || m.is_recommended),
      )
      .sort(
        (a, b) =>
          Number(categories.has(b.category_id)) - Number(categories.has(a.category_id)) ||
          Number(b.is_recommended) - Number(a.is_recommended),
      )
      .slice(0, limit)
  }
  const res = await api.get('/recommendations', {
    params: { item_ids: item_ids.length ? item_ids.join(',') : undefined, limit },
  })
  return res.data.data.map(withPhoto)
}
