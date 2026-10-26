import { expect, test } from '@playwright/test'

test('menu shows search, categories, the QR note and sections', async ({ page }) => {
  await page.goto('/menu')
  await expect(page.getByRole('heading', { name: 'Our Menu', level: 1 })).toBeVisible()
  await expect(page.getByText('Kain na!')).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText('Home/Menu')
  await expect(page.getByRole('button', { name: 'Back' })).toHaveCount(0)
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

test('recommended dishes show a best seller badge and their category', async ({ page }) => {
  await page.goto('/menu')
  const popular = page.getByRole('region', { name: 'Popular' })
  await expect(popular.getByText('Best Seller').first()).toBeVisible()
  await expect(popular.getByText("Vencio's Classics").first()).toBeVisible()
  await expect(page.getByText('Dining in? Scan the QR code on your table to order.')).toBeVisible()
})

test('the breadcrumb home link goes to the home page', async ({ page }) => {
  await page.goto('/menu')
  await page
    .getByRole('navigation', { name: 'Breadcrumb' })
    .getByRole('link', { name: 'Home' })
    .click()
  await expect(page).toHaveURL('/')
})

test('max price hides dearer dishes until the filters are cleared', async ({ page }) => {
  await page.goto('/menu')
  await expect(page.getByRole('button', { name: 'Clear filters' })).toHaveCount(0)
  await page.getByLabel('Max price').fill('300')
  await expect(page.getByText('₱35.00 – ₱300.00')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Bulalo' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Plain Rice' })).toBeVisible()
  await page.getByRole('button', { name: 'Clear filters' }).click()
  await expect(page.getByRole('heading', { name: 'Bulalo' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Clear filters' })).toHaveCount(0)
})

test('the best seller tag shows only best sellers', async ({ page }) => {
  await page.goto('/menu')
  const tag = page.getByRole('button', { name: 'Best Seller', exact: true })
  await tag.click()
  await expect(tag).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('heading', { name: 'Plain Rice' })).toHaveCount(0)
  const dishes = page.getByRole('main').getByRole('listitem')
  const count = await dishes.count()
  expect(count).toBeGreaterThan(0)
  for (let i = 0; i < count; i++) {
    await expect(dishes.nth(i)).toContainText('Best Seller')
  }
  await tag.click()
  await expect(page.getByRole('heading', { name: 'Plain Rice' })).toBeVisible()
})

test('dragging max price fully right shows every dish again', async ({ page }) => {
  await page.goto('/menu')
  const slider = page.getByLabel('Max price')
  await slider.fill('300')
  await expect(page.getByRole('heading', { name: 'All Star Pizza Bundle' })).toHaveCount(0)
  await slider.fill((await slider.getAttribute('max')) ?? '')
  await expect(page.getByRole('heading', { name: 'All Star Pizza Bundle' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Clear filters' })).toHaveCount(0)
})
