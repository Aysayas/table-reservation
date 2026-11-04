import { expect, test } from '@playwright/test'
import { readCsv } from './csv.js'

const url = '/admin/payments'

test('payments shows the totals and the newest payments first', async ({ page }) => {
  await page.goto(url)
  await expect(page.getByRole('heading', { name: 'Payments', level: 1 })).toBeVisible()
  for (const [label, value] of [
    ['Total Collected', '₱6,479.00'],
    ['Online', '₱4,385.00'],
    ['Cash', '₱2,094.00'],
    ['Deposits', '₱400.00'],
  ]) {
    await expect(page.getByRole('term').filter({ hasText: label })).toBeVisible()
    await expect(page.getByRole('definition').filter({ hasText: value })).toBeVisible()
  }
  for (const column of ['Payment ID', 'Date', 'For', 'Method', 'Reference', 'Amount', 'Status']) {
    await expect(page.getByRole('columnheader', { name: column })).toBeVisible()
  }
  const first = page.getByRole('row').nth(1)
  await expect(first).toContainText('PAY-0010')
  await expect(first).toContainText('Not paid')
  await expect(first).toContainText('Failed')
  await expect(page.getByRole('row', { name: /PAY-0009/ })).toContainText('Deposit RSV-000001')
  await expect(page.getByText('Showing 1–8 of 10')).toBeVisible()
})

test('search finds a payment by ID, order number or ref code', async ({ page }) => {
  await page.goto(url)
  const search = page.getByLabel('Search')
  await search.fill('PAY-0003')
  await expect(page.getByRole('row')).toHaveCount(2)
  await expect(page.getByRole('row').nth(1)).toContainText('Order #5')
  await search.fill('#4')
  await expect(page.getByRole('row').nth(1)).toContainText('PAY-0002')
  await search.fill('rsv-000001')
  await expect(page.getByRole('row').nth(1)).toContainText('PAY-0009')
  await search.fill('nothing')
  await expect(page.getByText('No payments found.')).toBeVisible()
})

test('filters narrow the list, and a date range changes the totals', async ({ page }) => {
  await page.goto(url)
  await page.getByLabel('Method').selectOption('cash')
  await expect(page.getByText('Showing 1–4 of 4')).toBeVisible()
  await page.getByRole('button', { name: 'Clear filters' }).click()
  await page.getByLabel('Status').selectOption('failed')
  await expect(page.getByRole('row')).toHaveCount(2)
  await page.getByRole('button', { name: 'Clear filters' }).click()

  await page.getByLabel('Date range').selectOption('0')
  await expect(page.getByText('Showing 1–1 of 1')).toBeVisible()
  await expect(page.getByRole('definition').filter({ hasText: '₱775.00' }).first()).toBeVisible()
  await expect(page.getByRole('row', { name: /PAY-0010/ })).toHaveCount(0)
})

test('the pages show 8 payments at a time', async ({ page }) => {
  await page.goto(url)
  await expect(page.getByText('Showing 1–8 of 10')).toBeVisible()
  await expect(page.getByRole('row')).toHaveCount(9)
  await page.getByRole('button', { name: 'Next page' }).click()
  await expect(page.getByText('Showing 9–10 of 10')).toBeVisible()
  await expect(page.getByRole('row')).toHaveCount(3)
  await expect(page.getByRole('button', { name: 'Next page' })).toBeDisabled()
})

test('export downloads every matching payment, not just one page, with the totals', async ({
  page,
}) => {
  await page.goto(url)
  await expect(page.getByText('Showing 1–8 of 10')).toBeVisible()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export' }).click()
  const file = await download
  expect(file.suggestedFilename()).toMatch(/^payments-\d{4}-\d{2}-\d{2}\.csv$/)
  const rows = await readCsv(file)
  expect(rows[0]).toEqual([
    'Payment ID',
    'Date',
    'For',
    'Method',
    'Reference',
    'Received By',
    'Amount',
    'Status',
  ])
  const payments = rows.slice(
    1,
    rows.findIndex((r) => r.length === 0),
  )
  expect(payments).toHaveLength(10)
  expect(payments[0][0]).toBe('PAY-0010')
  expect(rows.find((r) => r[0] === 'Total Collected')?.[6]).toBe('6479.00')
  expect(rows.find((r) => r[0] === 'Deposits')?.[6]).toBe('400.00')
})

test('export follows the filters', async ({ page }) => {
  await page.goto(url)
  await page.getByLabel('Method').selectOption('cash')
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export' }).click()
  const rows = await readCsv(await download)
  const payments = rows.slice(
    1,
    rows.findIndex((r) => r.length === 0),
  )
  expect(payments.length).toBeGreaterThan(0)
  expect(payments.every((r) => r[3] === 'Cash')).toBe(true)
})
