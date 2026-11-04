import { expect, test } from '@playwright/test'
import { readCsv } from './csv.js'

const url = '/admin/orders'

test('order history lists the newest orders, 8 a page', async ({ page }) => {
  await page.goto(url)
  await expect(page.getByRole('heading', { name: 'Order History', level: 1 })).toBeVisible()
  for (const column of [
    'Order #',
    'Date',
    'Table',
    'Items',
    'Total',
    'Payment',
    'Method',
    'Status',
  ]) {
    await expect(page.getByRole('columnheader', { name: column, exact: true })).toBeVisible()
  }
  await expect(page.getByRole('row')).toHaveCount(9)
  const first = page.getByRole('row').nth(1)
  await expect(first).toContainText('#4')
  await expect(first).toContainText('₱775.00')
  await expect(first).toContainText('Paid')
  await expect(first).toContainText('Online')
  await expect(first).toContainText('Ready')
  await expect(page.getByText('Showing 1–8 of 10')).toBeVisible()
  await page.getByRole('button', { name: '2', exact: true }).click()
  await expect(page.getByText('Showing 9–10 of 10')).toBeVisible()
})

test('search and filters narrow the list, and clear brings it back', async ({ page }) => {
  await page.goto(url)
  await page.getByLabel('Search').fill('#5')
  await expect(page.getByRole('row')).toHaveCount(2)
  await expect(page.getByRole('row').nth(1)).toContainText('T3')
  await page.getByLabel('Search').fill('T2')
  await expect(page.getByRole('row').nth(1)).toContainText('#1')

  await page.getByRole('button', { name: 'Clear filters' }).click()
  await page.getByLabel('Payment').selectOption('unpaid')
  await expect(page.getByRole('row')).toHaveCount(3)
  await page.getByLabel('Payment').selectOption('')
  await page.getByLabel('Status').selectOption('served')
  await expect(page.getByText('Showing 1–7 of 7')).toBeVisible()
  await page.getByLabel('Status').selectOption('')
  await page.getByLabel('Date range').selectOption('0')
  await expect(page.getByText('Showing 1–3 of 3')).toBeVisible()

  await page.getByLabel('Search').fill('999')
  await expect(page.getByText('No orders found.')).toBeVisible()
  await page.getByRole('button', { name: 'Clear filters' }).click()
  await expect(page.getByText('Showing 1–8 of 10')).toBeVisible()
})

test('view shows the order items and totals', async ({ page }) => {
  await page.goto(url)
  await page.getByRole('button', { name: 'View order #1' }).click()
  const dialog = page.getByRole('dialog', { name: 'Order #1' })
  await expect(dialog).toContainText('Table T2')
  await expect(dialog).toContainText('2× Hungarian Sausage with Bread and Egg')
  await expect(dialog).toContainText('Note: No onions')
  await expect(dialog).toContainText('₱926.00')
  await expect(dialog).toContainText('Unpaid')
  await dialog.getByRole('button', { name: 'Close' }).click()
  await expect(dialog).toHaveCount(0)
})

test('export downloads the shown orders as a CSV', async ({ page }) => {
  await page.goto(url)
  await page.getByLabel('Payment').selectOption('unpaid')
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export' }).click()
  const file = await download
  expect(file.suggestedFilename()).toMatch(/^order-history-\d{4}-\d{2}-\d{2}\.csv$/)
  const rows = await readCsv(file)
  expect(rows[0]).toEqual([
    'Order #',
    'Date',
    'Table',
    'Items',
    'Item List',
    'Total',
    'Payment',
    'Method',
    'Status',
  ])
  expect(rows).toHaveLength(3)
  expect(rows[1][4]).toMatch(/^\d+× .+/)
  expect(rows.slice(1).every((r) => r[6] === 'Unpaid')).toBe(true)
})
