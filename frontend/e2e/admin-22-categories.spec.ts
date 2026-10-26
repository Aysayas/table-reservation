import { expect, test } from '@playwright/test'

const url = '/admin/categories'

test('categories lists each category with its order and dish count', async ({ page }) => {
  await page.goto(url)
  await expect(page.getByRole('heading', { name: 'Categories', level: 1 })).toBeVisible()
  for (const column of ['Order', 'Category Name', 'Items', 'Actions']) {
    await expect(page.getByRole('columnheader', { name: column })).toBeVisible()
  }
  const first = page.getByRole('row').nth(1)
  await expect(first).toContainText('1')
  await expect(first).toContainText('Breakfast Corner')
  await expect(first).toContainText('8')
  const form = page.getByRole('region', { name: 'Add Category' })
  await expect(form.getByLabel('Category Name')).toHaveAttribute('placeholder', 'e.g. Grilled')
  await expect(form.getByLabel('Display Order')).toHaveValue('17')
  await expect(form.getByRole('button', { name: 'Save Category' })).toBeVisible()
})

test('adding a category puts it in the list, and names must be unique', async ({ page }) => {
  await page.goto(url)
  await page.getByRole('button', { name: 'Save Category' }).click()
  await expect(page.getByText('Enter a category name')).toBeVisible()

  await page.getByLabel('Category Name').fill('Grilled')
  await page.getByRole('button', { name: 'Save Category' }).click()
  await expect(page.getByText('Grilled saved')).toBeVisible()
  const row = page.getByRole('row').filter({ hasText: 'Grilled' })
  await expect(row).toContainText('17')
  await expect(row).toContainText('0')
  await expect(page.getByLabel('Category Name')).toHaveValue('')
  await expect(page.getByLabel('Display Order')).toHaveValue('18')

  await page.getByLabel('Category Name').fill('prelude')
  await page.getByRole('button', { name: 'Save Category' }).click()
  await expect(page.getByText('A category with that name already exists')).toBeVisible()
})

test('edit fills the form and saves the new name', async ({ page }) => {
  await page.goto(url)
  await page.getByRole('button', { name: 'Edit Prelude' }).click()
  const form = page.getByRole('region', { name: 'Edit Category' })
  await expect(form.getByLabel('Category Name')).toHaveValue('Prelude')
  await expect(form.getByLabel('Display Order')).toHaveValue('2')
  await form.getByLabel('Category Name').fill('Starters')
  await form.getByRole('button', { name: 'Save Category' }).click()
  await expect(page.getByText('Starters saved')).toBeVisible()
  await expect(page.getByRole('row').nth(2)).toContainText('Starters')
  await expect(page.getByRole('region', { name: 'Add Category' })).toBeVisible()

  await page.getByRole('button', { name: 'Edit Rice Harmony' }).click()
  await page.getByRole('button', { name: 'Cancel Edit' }).click()
  await expect(page.getByRole('region', { name: 'Add Category' })).toBeVisible()
})

test('delete asks first and keeps a category that still has dishes', async ({ page }) => {
  await page.goto(url)
  await page.getByRole('button', { name: 'Delete Prelude' }).click()
  const dialog = page.getByRole('dialog', { name: 'Delete Prelude?' })
  await expect(dialog).toContainText("It still has 6 dishes, so it can't be deleted yet.")
  await dialog.getByRole('button', { name: 'Delete' }).click()
  await expect(
    page.getByText('This category still has dishes. Move or delete them first.'),
  ).toBeVisible()
  await expect(page.getByRole('cell', { name: 'Prelude', exact: true })).toBeVisible()

  await page.getByLabel('Category Name').fill('Grilled')
  await page.getByRole('button', { name: 'Save Category' }).click()
  await page.getByRole('button', { name: 'Delete Grilled' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByRole('button', { name: 'Delete Grilled' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByText('Grilled deleted')).toBeVisible()
  await expect(page.getByRole('cell', { name: 'Grilled', exact: true })).toHaveCount(0)
})
