import { expect, test } from '@playwright/test'

const url = '/staff/reservations'

test("today's reservations shows the filters, columns and today's bookings", async ({ page }) => {
  await page.goto(url)
  await expect(page.getByRole('searchbox', { name: 'Search' })).toBeVisible()
  await expect(page.getByLabel('Day')).toHaveValue('today')
  await expect(page.getByLabel('Status')).toHaveValue('')
  for (const column of [
    'Ref Code',
    'Time',
    'Name',
    'Mobile',
    'Guests',
    'Table',
    'Deposit',
    'Status',
    'Actions',
  ]) {
    await expect(page.getByRole('columnheader', { name: column })).toBeVisible()
  }
  await expect(page.getByRole('row')).toHaveCount(6)
  await expect(page.getByText('0900 000 0000').first()).toBeVisible()
  await expect(page.getByText('Showing 1–5 of 5')).toBeVisible()
})

test('arrived and no-show change a confirmed booking', async ({ page }) => {
  await page.goto(url)
  await page.getByRole('button', { name: 'Mark RSV-000004 arrived' }).click()
  await expect(page.getByText('RSV-000004 is now arrived')).toBeVisible()
  await expect(page.getByRole('row', { name: /RSV-000004/ })).toContainText('Arrived')
  await page.getByRole('button', { name: 'Mark RSV-000005 no-show' }).click()
  await expect(page.getByRole('row', { name: /RSV-000005/ })).toContainText('No-show')
})

test('assign table lists tables that fit and confirms the booking', async ({ page }) => {
  await page.goto(url)
  await page.getByRole('button', { name: 'Assign a table to RSV-000007' }).click()
  const dialog = page.getByRole('dialog', { name: 'Assign a table' })
  await expect(dialog.getByRole('button', { name: /T1 / })).toHaveCount(0)
  await dialog.getByRole('button', { name: /T5/ }).click()
  await expect(dialog).toHaveCount(0)
  const row = page.getByRole('row', { name: /RSV-000007/ })
  await expect(row).toContainText('T5')
  await expect(row).toContainText('Confirmed')
})

test('status filter, search across days and an empty view', async ({ page }) => {
  await page.goto(url)
  await page.getByLabel('Status').selectOption('pending')
  await expect(page.getByRole('row')).toHaveCount(2)
  await page.getByLabel('Status').selectOption('')
  await page.getByRole('searchbox', { name: 'Search' }).fill('RSV-000001')
  await expect(page.getByRole('row', { name: /RSV-000001/ })).toBeVisible()
  await page.getByRole('searchbox', { name: 'Search' }).fill('')
  await page.getByLabel('Day').selectOption('upcoming')
  await expect(page.getByText('No reservations found.')).toBeVisible()
})
