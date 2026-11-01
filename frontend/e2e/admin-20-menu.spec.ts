import { expect, test } from '@playwright/test'

const url = '/admin/menu'

test('menu management lists 8 dishes a page with search and category filter', async ({ page }) => {
  await page.goto(url)
  await expect(page.getByRole('heading', { name: 'Menu Management', level: 1 })).toBeVisible()
  for (const column of ['Image', 'Name', 'Category', 'Price', 'Available', 'Actions']) {
    await expect(page.getByRole('columnheader', { name: column })).toBeVisible()
  }
  await expect(page.getByRole('row')).toHaveCount(9)
  await expect(page.getByText(/^Showing 1–8 of \d+$/)).toBeVisible()

  await page.getByRole('button', { name: '2', exact: true }).click()
  await expect(page.getByText(/^Showing 9–16 of \d+$/)).toBeVisible()
  await page.getByRole('button', { name: 'Previous page' }).click()
  await expect(page.getByText(/^Showing 1–8 of \d+$/)).toBeVisible()

  await page.getByLabel('Search').fill('bulalo')
  await expect(page.getByRole('row')).toHaveCount(2)
  await expect(page.getByText('Showing 1–1 of 1')).toBeVisible()
  await page.getByLabel('Search').fill('')

  await page.getByLabel('Category').selectOption({ label: 'Breakfast Corner' })
  await expect(page.getByRole('cell', { name: 'Breakfast Corner' }).first()).toBeVisible()
  await page.getByLabel('Search').fill('zzz')
  await expect(page.getByText('No menu items found.')).toBeVisible()
})

test('the available switch turns a dish off and on', async ({ page }) => {
  await page.goto(url)
  const toggle = page.getByRole('switch', { name: 'Poached Egg available' })
  await expect(toggle).toHaveAttribute('aria-checked', 'true')
  await toggle.click()
  await expect(page.getByText('Poached Egg is now unavailable')).toBeVisible()
  await expect(toggle).toHaveAttribute('aria-checked', 'false')
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-checked', 'true')
})

test('add and edit open screen 21', async ({ page }) => {
  await page.goto(url)
  await page.getByRole('link', { name: 'Add Menu Item' }).click()
  await expect(page).toHaveURL('/admin/menu/new')
  await page.goto(url)
  await page.getByRole('link', { name: 'Edit Poached Egg' }).click()
  await expect(page).toHaveURL(/\/admin\/menu\/\d+\/edit$/)
})

test('delete asks first, and an ordered dish cannot be deleted', async ({ page }) => {
  await page.goto(url)
  await page.getByRole('button', { name: 'Delete Poached Egg' }).click()
  const dialog = page.getByRole('dialog', { name: 'Delete Poached Egg?' })
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(dialog).toHaveCount(0)
  await page.getByRole('button', { name: 'Delete Poached Egg' }).click()
  await dialog.getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByText('Poached Egg deleted')).toBeVisible()
  await expect(page.getByRole('cell', { name: 'Poached Egg' })).toHaveCount(0)

  await page.getByRole('button', { name: 'Delete Hungarian Sausage with Bread and Egg' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()
  await expect(
    page.getByText('This dish has been ordered before. Turn off Available instead.'),
  ).toBeVisible()
  await expect(
    page.getByRole('cell', { name: 'Hungarian Sausage with Bread and Egg', exact: true }),
  ).toBeVisible()
})

test('search, category and page are kept after editing a dish', async ({ page }) => {
  await page.goto(url)
  await page.getByLabel('Search').fill('bulalo')
  await expect(page).toHaveURL('/admin/menu?q=bulalo')
  await page.getByRole('link', { name: /^Edit/ }).first().click()
  await page.getByRole('link', { name: /^Cancel/ }).click()
  await expect(page).toHaveURL('/admin/menu?q=bulalo')
  await expect(page.getByLabel('Search')).toHaveValue('bulalo')
  await expect(page.getByText('Showing 1–1 of 1')).toBeVisible()
})
