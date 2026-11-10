import { expect, test } from '@playwright/test'

const url = '/table/5?t=sample-qr-token-5'

test('table menu shows the table, search, categories and dishes', async ({ page }) => {
  await page.goto(url)
  await expect(page.getByText('Table T5', { exact: true })).toBeVisible()
  await expect(page.getByRole('searchbox', { name: 'Search menu' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'All', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(page.getByRole('heading', { name: 'Recommended for You' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Breakfast Corner' })).toBeVisible()
})

test('add puts dishes in the cart and shows the total', async ({ page }) => {
  await page.goto(url)
  const add = page.getByRole('button', { name: 'Add Hungarian Sausage with Bread and Egg' })
  await add.click()
  await expect(page.getByRole('link', { name: /View Cart · 1 item/ })).toContainText('₱285.00')
  await expect(page.getByRole('link', { name: 'Cart, 1 item' })).toBeVisible()
  await add.click()
  await expect(page.getByRole('link', { name: /View Cart · 2 items/ })).toContainText('₱570.00')
})

test('the cart is kept for the table after a refresh', async ({ page }) => {
  await page.goto(url)
  await page.getByRole('button', { name: 'Add Bulalo' }).click()
  await page.reload()
  await expect(page.getByRole('link', { name: /View Cart · 1 item/ })).toContainText('₱450.00')
})

test('a dish opens its details and view cart opens the cart', async ({ page }) => {
  await page.goto(url)
  await page.getByRole('link', { name: /Tapa with Dilis/ }).click()
  await expect(page).toHaveURL(/\/table\/5\/menu\/\d+$/)
  await page.goto(url)
  await page.getByRole('button', { name: 'Add Nachos' }).click()
  await page.getByRole('link', { name: /View Cart/ }).click()
  await expect(page).toHaveURL('/table/5/cart')
})

test('an unknown table asks to scan again', async ({ page }) => {
  await page.goto('/table/99')
  await expect(page.getByRole('heading', { name: 'Table not found' })).toBeVisible()
})

test('recommended for you slides gently and stands still with reduced motion', async ({ page }) => {
  await page.goto(url)
  const row = page.getByRole('region', { name: 'Recommended for You' }).getByRole('list')
  await expect(row).toHaveCSS('animation-name', 'marquee')
  await expect(row.getByRole('link')).toHaveCount(4)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(row).toHaveCSS('animation-name', 'none')
})

test('a missing table does not warn about undefined query data', async ({ page }) => {
  const warnings: string[] = []
  page.on('console', (msg) => warnings.push(msg.text()))
  await page.goto('/table/99')
  await expect(page.getByRole('heading', { name: 'Table not found' })).toBeVisible()
  expect(warnings.filter((w) => w.includes('Query data cannot be undefined'))).toEqual([])
})

test('add sends a gold dot to the cart, and not with reduced motion', async ({ page }) => {
  await page.goto(url)
  const add = page.getByRole('button', { name: 'Add Hungarian Sausage with Bread and Egg' })
  const dots = page.locator('body > span[aria-hidden="true"].fixed')
  await add.click()
  await expect(page.getByRole('link', { name: /View Cart · 1 item/ })).toBeVisible()
  await add.click()
  await expect(dots).toHaveCount(1)
  await expect(dots).toHaveCount(0)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await add.click()
  await expect(page.getByRole('link', { name: /View Cart · 3 items/ })).toBeVisible()
  await expect(dots).toHaveCount(0)
})

test('each recommendation says why it is there', async ({ page }) => {
  await page.goto(url)
  const row = page.getByRole('region', { name: 'Recommended for You' })
  await expect(row.getByRole('link').first()).toContainText("Kitchen's pick")
})
