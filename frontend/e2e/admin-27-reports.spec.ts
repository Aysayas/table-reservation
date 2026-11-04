import { expect, test } from '@playwright/test'
import { readCsv } from './csv.js'

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

test('download PDF prints a branded report, not the dashboard', async ({ page }) => {
  await page.goto(url)
  await expect(page.getByRole('heading', { name: 'Summary' })).toBeVisible()
  await page.getByRole('button', { name: 'Download PDF' }).click()
  await expect.poll(() => page.evaluate('window.__printed')).toBe(true)
  await page.emulateMedia({ media: 'print' })
  const doc = page.getByRole('article', { name: 'Printable sales report' })
  await expect(doc).toBeVisible()
  await expect(doc.getByRole('img', { name: "Vencio's Garden logo" })).toBeVisible()
  await expect(doc.getByRole('heading', { name: 'Sales Report' })).toBeVisible()
  await expect(doc.getByText(/^Daily · \w{3} \d+, \d{4} – \w{3} \d+, \d{4}$/)).toBeVisible()
  await expect(doc.getByText(/^Generated .+ by .+/)).toBeVisible()
  for (const section of [
    'Collections',
    'Sales Over Time',
    'Best Sellers',
    'Reservations per Day',
  ]) {
    await expect(doc.getByRole('heading', { name: section })).toBeVisible()
  }
  await expect(doc.getByRole('row', { name: /^Total collected/ })).toBeVisible()
  await expect(doc.getByRole('row', { name: /^Total ₱/ })).toBeVisible()
  await expect(doc.getByRole('row', { name: /^Total \d+$/ })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Download PDF' })).toBeHidden()
  await expect(page.getByRole('navigation', { name: 'Admin menu' })).toBeHidden()
  await page.emulateMedia({ media: 'screen' })
  await expect(doc).toBeHidden()
})

test('download CSV has every report section with totals', async ({ page }) => {
  await page.goto(url)
  await expect(page.getByRole('heading', { name: 'Summary' })).toBeVisible()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download CSV' }).click()
  const file = await download
  expect(file.suggestedFilename()).toMatch(
    /^vencios-report-\d{4}-\d{2}-\d{2}-to-\d{4}-\d{2}-\d{2}\.csv$/,
  )
  const rows = await readCsv(file)
  const first = rows.map((r) => r[0])
  for (const section of ['Summary', 'Sales Over Time', 'Best Sellers', 'Reservations Per Day']) {
    expect(first).toContain(section)
  }
  expect(rows.find((r) => r[0] === 'Period')?.[1]).toBe('Daily')
  expect(first.filter((c) => c === 'Total').length).toBe(2)
  expect(rows.some((r) => r[1] === 'Total')).toBe(true)
})
