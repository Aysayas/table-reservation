import { expect, test } from '@playwright/test'

const url = '/staff/tables'

test('table status shows the filters with counts and a card per table', async ({ page }) => {
  await page.goto(url)
  const filters = page.getByRole('group', { name: 'Filter tables' })
  for (const name of ['All (9)', 'Available (2)', 'Occupied (4)', 'Reserved (3)']) {
    await expect(filters.getByRole('button', { name })).toBeVisible()
  }
  await expect(page.getByRole('listitem', { name: /^Table T\d$/ })).toHaveCount(9)
  await expect(page.getByRole('listitem', { name: 'Table T3' })).toContainText('Ready for guests')
  const t2 = page.getByRole('listitem', { name: 'Table T2' })
  await expect(t2).toContainText('Occupied')
  await expect(t2).toContainText('Order #1 · ₱926.00')
  await expect(t2).toContainText('Seated')
  const t5 = page.getByRole('listitem', { name: 'Table T5' })
  await expect(t5).toContainText('Customer Name · 6:00 PM')
  await expect(t5).toContainText('RSV-000005')
})

test('a filter shows only those tables', async ({ page }) => {
  await page.goto(url)
  await page.getByRole('button', { name: 'Reserved (3)' }).click()
  await expect(page.getByRole('listitem', { name: /^Table T\d$/ })).toHaveCount(3)
})

test('mark arrived turns a reserved table occupied', async ({ page }) => {
  await page.goto(url)
  await page
    .getByRole('listitem', { name: 'Table T5' })
    .getByRole('button', { name: 'Mark Arrived' })
    .click()
  await expect(page.getByText('RSV-000005 arrived at T5')).toBeVisible()
  await expect(page.getByRole('listitem', { name: 'Table T5' })).toContainText('Occupied')
  await expect(page.getByRole('button', { name: 'Occupied (5)' })).toBeVisible()
})

test('view order opens orders and payments for that order', async ({ page }) => {
  await page.goto(url)
  await page
    .getByRole('listitem', { name: 'Table T2' })
    .getByRole('link', { name: 'View Order' })
    .click()
  await expect(page).toHaveURL('/staff/orders?order=1')
})

test('free table shows only when nothing is left to serve or pay, and frees the table', async ({
  page,
}) => {
  await page.goto(url)
  const t2 = page.getByRole('listitem', { name: 'Table T2' })
  await expect(t2.getByRole('button', { name: 'Free Table' })).toHaveCount(0)
  const t1 = page.getByRole('listitem', { name: 'Table T1' })
  await expect(t1).toContainText('No unpaid or unserved order')
  await t1.getByRole('button', { name: 'Free Table' }).click()
  await expect(page.getByText('T1 is now available')).toBeVisible()
  await expect(t1).toContainText('Ready for guests')
  await expect(page.getByRole('button', { name: 'Available (3)' })).toBeVisible()
})

test('an available table with a new order shows as occupied with the order', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/table/3?t=sample-qr-token-3')
  await page.getByRole('button', { name: 'Add Bulalo' }).click()
  await page.goto('/table/3/checkout')
  await page.getByRole('radio', { name: /Pay at the Counter/ }).check()
  await page.getByRole('button', { name: 'Place Order' }).click()
  await expect(page).toHaveURL(/\/table\/3\/orders\?order=\d+/)
  const orderId = new URL(page.url()).searchParams.get('order')
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.evaluate(
    `history.pushState({}, '', '/staff/tables'); dispatchEvent(new PopStateEvent('popstate'))`,
  )
  const t3 = page.getByRole('listitem', { name: 'Table T3' })
  await expect(t3).toContainText('Occupied')
  await expect(t3).toContainText(`Order #${orderId}`)
  await expect(t3).not.toContainText('Ready for guests')
  await expect(t3.getByRole('link', { name: 'View Order' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Available (1)' })).toBeVisible()
})
