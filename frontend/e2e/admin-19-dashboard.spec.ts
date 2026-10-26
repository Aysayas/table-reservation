import { expect, test } from '@playwright/test'

const url = '/admin'

test('admin dashboard shows today, the sales chart, best sellers and recent orders', async ({
  page,
}) => {
  await page.goto(url)
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()
  for (const [label, value] of [
    ['Sales Today', '₱775.00'],
    ['Orders Today', '3'],
    ['Reservations Today', '5'],
    ['No-show Rate', '0%'],
  ]) {
    await expect(page.getByRole('definition').filter({ hasText: value }).first()).toBeVisible()
    await expect(page.getByRole('term').filter({ hasText: label })).toBeVisible()
  }
  await expect(page.getByRole('heading', { name: 'Sales (Last 7 Days)' })).toBeVisible()
  await expect(page.getByRole('img', { name: /^Sales for the last 7 days/ })).toBeVisible()

  const best = page.getByRole('region', { name: 'Best Sellers' }).getByRole('listitem')
  await expect(best).toHaveCount(5)
  await expect(best.first()).toContainText('Plain Rice')
  await expect(best.first()).toContainText('9 sold')

  const recent = page.getByRole('region', { name: 'Recent Orders' })
  for (const column of ['Order #', 'Date', 'Table', 'Items', 'Total', 'Payment', 'Status']) {
    await expect(recent.getByRole('columnheader', { name: column })).toBeVisible()
  }
  await expect(recent.getByRole('row')).toHaveCount(6)
  await expect(recent.getByRole('row').nth(1)).toContainText('#4')
  await expect(recent.getByRole('row').nth(1)).toContainText('Paid · Online')
})

test('view all opens order history', async ({ page }) => {
  await page.goto(url)
  await page.getByRole('link', { name: 'View all' }).click()
  await expect(page).toHaveURL('/admin/orders')
})
