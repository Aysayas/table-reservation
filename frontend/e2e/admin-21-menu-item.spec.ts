import { expect, test } from '@playwright/test'

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

test('add menu item shows the form and the photo card', async ({ page }) => {
  await page.goto('/admin/menu/new')
  await expect(page.getByRole('heading', { name: 'Add Menu Item', level: 1 })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText(
    'Menu/Add Menu Item',
  )
  for (const name of ['Item Name', 'Category', 'Price (₱)', 'Description']) {
    await expect(page.getByLabel(name, { exact: true })).toBeVisible()
  }
  await expect(page.getByRole('switch', { name: 'Available' })).toHaveAttribute(
    'aria-checked',
    'true',
  )
  await expect(page.getByRole('switch', { name: 'Show in Recommendations' })).toHaveAttribute(
    'aria-checked',
    'true',
  )
  await expect(page.getByText('Drag a photo here')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Upload Photo' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Menu', exact: true }).first()).toBeVisible()
})

test('saving an empty form shows what is missing', async ({ page }) => {
  await page.goto('/admin/menu/new')
  await page.getByRole('button', { name: 'Save Item' }).click()
  for (const message of ['Enter the item name', 'Choose a category', 'Enter a price']) {
    await expect(page.getByText(message)).toBeVisible()
  }
  await expect(page).toHaveURL('/admin/menu/new')
})

test('a new dish with a photo is saved and shows on the menu list', async ({ page }) => {
  await page.goto('/admin/menu/new')
  await page.getByLabel('Item Name').fill('Ensaladang Talong')
  await page.getByLabel('Category', { exact: true }).selectOption({ index: 1 })
  await page.getByLabel('Price (₱)').fill('180')
  await page.getByLabel('Description').fill('Fresh greens with calamansi dressing.')
  await page.getByRole('switch', { name: 'Show in Recommendations' }).click()
  await page.getByLabel('Photo file').setInputFiles({
    name: 'salad.png',
    mimeType: 'image/png',
    buffer: png,
  })
  await expect(page.getByRole('img', { name: 'Photo preview' })).toBeVisible()
  await page.getByRole('button', { name: 'Save Item' }).click()
  await expect(page).toHaveURL('/admin/menu')
  await expect(page.getByText('Ensaladang Talong saved')).toBeVisible()
  await page.getByLabel('Search').fill('Ensaladang Talong')
  await expect(page.getByRole('row')).toHaveCount(2)
  await expect(page.getByRole('row').nth(1)).toContainText('₱180.00')
})

test('a wrong photo type is refused', async ({ page }) => {
  await page.goto('/admin/menu/new')
  await page.getByLabel('Photo file').setInputFiles({
    name: 'notes.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('hello'),
  })
  await expect(page.getByText('Use a JPG or PNG photo')).toBeVisible()
  await expect(page.getByText('Drag a photo here')).toBeVisible()
})

test('editing a dish fills the form and saves the new price', async ({ page }) => {
  await page.goto('/admin/menu')
  await page.getByRole('link', { name: 'Edit Hungarian Sausage with Bread and Egg' }).click()
  await expect(page.getByRole('heading', { name: 'Edit Menu Item', level: 1 })).toBeVisible()
  await expect(page.getByLabel('Item Name')).toHaveValue('Hungarian Sausage with Bread and Egg')
  await expect(page.getByLabel('Price (₱)')).toHaveValue('285')
  await page.getByLabel('Price (₱)').fill('300')
  await page.getByRole('button', { name: 'Save Item' }).click()
  await expect(page).toHaveURL('/admin/menu')
  await expect(page.getByRole('row').nth(1)).toContainText('₱300.00')
})

test('cancel goes back, and an unknown dish is not found', async ({ page }) => {
  await page.goto('/admin/menu/new')
  await page.getByRole('link', { name: 'Cancel' }).click()
  await expect(page).toHaveURL('/admin/menu')
  await page.goto('/admin/menu/99999/edit')
  await expect(page.getByRole('heading', { name: 'Menu item not found' })).toBeVisible()
})
