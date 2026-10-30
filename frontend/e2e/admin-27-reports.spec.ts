import { expect, test } from '@playwright/test'

const url = '/admin/reports'
const day = (offset: number) => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toLocaleDateString('en-CA')
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript('window.print = () => { window.__printed = true }')
})

test('reports shows the last 7 days with the three charts and the summary', async ({ page }) => {
  await page.goto(url)
  await expect(page.getByRole('heading', { name: 'Reports', level: 1 })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Daily' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByLabel('From')).toHaveValue(day(-6))
  await expect(page.getByLabel('To')).toHaveValue(day(0))
  for (const name of ['Sales Over Time', 'Best-Selling Items', 'Reservations per Day', 'Summary']) {
    await expect(page.getByRole('heading', { name })).toBeVisible()
  }
  await expect(page.getByRole('img', { name: /^Sales over time:/ })).toBeVisible()
  await expect(
    page.getByRole('img', { name: /^Best-selling items: Plain Rice 9 sold/ }),
  ).toBeVisible()
  await expect(page.getByRole('img', { name: /^Reservations per day:/ })).toBeVisible()

  const summary = page.getByRole('region', { name: 'Summary' })
  for (const [term, value] of [
    ['Total Sales', '₱5,829.00'],
    ['Total Orders', '9'],
    ['Average Order Value', '₱832.71'],
    ['Reservations', '5'],
    ['No-shows', '0 (0%)'],
    ['Busiest Hour', '12:00 PM'],
  ]) {
    await expect(summary.getByRole('term').filter({ hasText: term })).toBeVisible()
    await expect(summary.getByRole('definition').filter({ hasText: value }).first()).toBeVisible()
  }
})

test('monthly covers six months, and a custom from date changes the summary', async ({ page }) => {
  await page.goto(url)
  await page.getByRole('button', { name: 'Monthly' }).click()
  await expect(page.getByRole('button', { name: 'Monthly' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  const first = new Date()
  first.setDate(1)
  first.setMonth(first.getMonth() - 5)
  await expect(page.getByLabel('From')).toHaveValue(first.toLocaleDateString('en-CA'))

  await page.getByRole('button', { name: 'Daily' }).click()
  await page.getByLabel('From').fill(day(0))
  const summary = page.getByRole('region', { name: 'Summary' })
  await expect(summary).toContainText('₱775.00')
  await expect(summary.getByRole('definition').nth(1)).toHaveText('3')
})

test('export PDF prints only the report', async ({ page }) => {
  await page.goto(url)
  await page.getByRole('button', { name: 'Export PDF' }).click()
  expect(await page.evaluate('window.__printed')).toBe(true)
  await page.emulateMedia({ media: 'print' })
  await expect(page.getByText(/^Report: /)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Export PDF' })).toBeHidden()
  await expect(page.getByRole('navigation', { name: 'Admin menu' })).toBeHidden()
  await expect(page.getByRole('heading', { name: 'Summary' })).toBeVisible()
})
