import { expect, test } from '@playwright/test'

const url = '/staff/tables'

test('table status shows the filters with counts and a card per table', async ({ page }) => {
  await page.goto(url)
  const filters = page.getByRole('group', { name: 'Filter tables' })
  for (const name of ['All (8)', 'Available (1)', 'Occupied (4)', 'Reserved (3)']) {
    await expect(filters.getByRole('button', { name })).toBeVisible()
  }
  await expect(page.getByRole('listitem', { name: /^Table T\d$/ })).toHaveCount(8)
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
