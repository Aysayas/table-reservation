import { expect, test } from '@playwright/test'

test('menu shows search, categories, the QR note and sections', async ({ page }) => {
  await page.goto('/menu')
  await expect(page.getByRole('heading', { name: 'Menu', exact: true })).toBeVisible()
  await expect(page.getByRole('searchbox', { name: 'Search menu' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: 'Breakfast Corner' })).toBeVisible()
  await expect(page.getByText('Scan the QR code on your table to order')).toBeVisible()
  for (const name of ['Popular', 'Breakfast Corner', "Vencio's Classics", 'Cocktails']) {
    await expect(page.getByRole('heading', { name, exact: true })).toBeAttached()
  }
  await expect(
    page.getByRole('region', { name: 'Breakfast Corner' }).getByText('₱285.00'),
  ).toBeVisible()
})

test('a category button shows only that section', async ({ page }) => {
  await page.goto('/menu')
  await page.getByRole('button', { name: 'Pinoy Desserts' }).click()
  await expect(page.getByRole('heading', { name: 'Pinoy Desserts', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Popular', exact: true })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Prelude', exact: true })).toHaveCount(0)
  await expect(page.getByText('Leche Flan')).toBeVisible()
})

test('search filters dishes and says when nothing matches', async ({ page }) => {
  await page.goto('/menu')
  await page.getByRole('searchbox', { name: 'Search menu' }).fill('bulalo')
  await expect(page.getByRole('heading', { name: 'Bulalo' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Soup Melodies', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Prelude', exact: true })).toHaveCount(0)
  await page.getByRole('searchbox', { name: 'Search menu' }).fill('xyz')
  await expect(page.getByText('No dishes match your search.')).toBeVisible()
})

test('an unavailable dish is marked', async ({ page }) => {
  await page.goto('/menu')
  await page.getByRole('searchbox', { name: 'Search menu' }).fill('gac juice')
  await expect(page.getByText('Not available')).toBeVisible()
})
