import { expect, test, type Page } from '@playwright/test'

const scan = async (page: Page, table: number) => {
  await page.goto(`/table/${table}?t=sample-qr-token-${table}`)
  await expect(page.getByRole('searchbox', { name: 'Search menu' })).toBeVisible()
}

test('a sample order shows its progress, items and payment', async ({ page }) => {
  await scan(page, 2)
  await page.goto('/table/2/orders?order=1')
  await expect(page.getByRole('heading', { name: 'Order #1' })).toBeVisible()
  await expect(page.getByText('Placed at 12:00 PM')).toBeVisible()
  const progress = page.getByRole('list', { name: 'Order progress' })
  for (const step of ['Received', 'Preparing', 'Ready', 'Served']) {
    await expect(progress.getByText(step, { exact: true })).toBeVisible()
  }
  await expect(progress.locator('[aria-current="step"]')).toContainText('Preparing')
  await expect(progress.getByText('In progress')).toBeVisible()
  await expect(page.getByText('2x Hungarian Sausage with Bread and Egg')).toBeVisible()
  await expect(page.getByText('Note: No onions')).toBeVisible()
  await expect(page.getByText('₱926.00')).toBeVisible()
  await expect(page.getByText('Unpaid · Pay at the counter')).toBeVisible()
})

test('placing an order with pay now shows it received and paid', async ({ page }) => {
  await scan(page, 5)
  await page.getByRole('button', { name: 'Add Bulalo' }).click()
  await page.getByRole('link', { name: /View Cart/ }).click()
  await page.getByRole('link', { name: 'Proceed to Checkout' }).click()
  await page.getByRole('button', { name: 'Place Order' }).click()
  await expect(page.getByRole('heading', { name: /^Order #\d+$/ })).toBeVisible()
  await expect(
    page.getByRole('list', { name: 'Order progress' }).locator('[aria-current="step"]'),
  ).toContainText('Received')
  await expect(page.getByText('1x Bulalo')).toBeVisible()
  await expect(page.getByText('Paid', { exact: true })).toBeVisible()
})

test('an unpaid order can be paid online from its status page', async ({ page }) => {
  await scan(page, 2)
  await page.goto('/table/2/orders?order=1')
  await page.getByRole('button', { name: 'Pay Now' }).click()
  await expect(page.getByText('Paid', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Pay Now' })).toHaveCount(0)
})

test('order more goes back to the table menu', async ({ page }) => {
  await scan(page, 2)
  await page.goto('/table/2/orders?order=1')
  await page.getByRole('link', { name: 'Order More' }).click()
  await expect(page).toHaveURL('/table/2/menu')
})

test('an order from another table is not shown', async ({ page }) => {
  await scan(page, 5)
  await page.goto('/table/5/orders?order=1')
  await expect(page.getByRole('heading', { name: 'Order not found' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Order More' })).toHaveAttribute(
    'href',
    '/table/5/menu',
  )
})
