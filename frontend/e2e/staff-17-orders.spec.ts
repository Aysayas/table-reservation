import { expect, test } from '@playwright/test'

const url = '/staff/orders'

test('orders and payments lists the orders and shows the chosen one', async ({ page }) => {
  await page.goto(`${url}?order=1`)
  for (const column of ['Order #', 'Table', 'Time', 'Total', 'Status', 'Payment']) {
    await expect(page.getByRole('columnheader', { name: column })).toBeVisible()
  }
  await expect(page.getByRole('row')).toHaveCount(11)
  const detail = page.getByRole('region', { name: 'Order #1' })
  await expect(detail).toContainText('Table T2 · 12:00 PM')
  await expect(detail).toContainText('2x Hungarian Sausage with Bread and Egg')
  await expect(detail).toContainText('₱926.00')
  await expect(detail.getByText('Unpaid', { exact: true })).toBeVisible()
})

test('the payment filter shows only unpaid or paid orders', async ({ page }) => {
  await page.goto(url)
  await page.getByRole('button', { name: 'Unpaid' }).click()
  await expect(page.getByRole('row')).toHaveCount(3)
  await page.getByRole('button', { name: 'Paid', exact: true }).click()
  await expect(page.getByRole('row')).toHaveCount(9)
})

test('cash received works out the change and marks the order paid', async ({ page }) => {
  await page.goto(`${url}?order=1`)
  const pay = page.getByRole('button', { name: 'Mark as Paid (Cash)' })
  await page.getByLabel('Cash Received').fill('500')
  await expect(page.getByText('Not enough cash for this order.')).toBeVisible()
  await expect(pay).toBeDisabled()
  await page.getByLabel('Cash Received').fill('1000')
  await expect(page.getByRole('region', { name: 'Order #1' })).toContainText('₱74.00')
  await pay.click()
  await expect(page.getByText('Order #1 paid in cash')).toBeVisible()
  await expect(page.getByRole('region', { name: 'Order #1' })).toContainText('Paid · Cash')
  await expect(pay).toHaveCount(0)
})

test('the printed receipt shows the order, payment and change', async ({ page }) => {
  await page.goto(`${url}?order=1`)
  await page.getByLabel('Cash Received').fill('1000')
  await page.getByRole('button', { name: 'Mark as Paid (Cash)' }).click()
  await page.emulateMedia({ media: 'print' })
  const receipt = page.locator('.font-mono')
  await expect(receipt).toBeVisible()
  for (const text of [
    "Vencio's Garden",
    'ORDER #1',
    'TABLE T2',
    '2 x HUNGARIAN SAUSAGE WITH BREAD AND EGG',
    '* No onions',
    'PAYMENT: CASH',
    '1,000.00',
    'CHANGE',
    '74.00',
    '*** SALAMAT PO! ***',
    'Served by: Staff Name',
  ]) {
    await expect(receipt).toContainText(text)
  }
  await expect(page.getByRole('navigation', { name: 'Staff menu' })).toBeHidden()
})
