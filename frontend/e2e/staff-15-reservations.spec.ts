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
    'Added',
    'Deposit',
    'Status',
    'Actions',
  ]) {
    await expect(page.getByRole('columnheader', { name: column })).toBeVisible()
  }
  await expect(page.getByRole('row')).toHaveCount(6)
  await expect(page.getByText('0900 000 0000').first()).toBeVisible()
  await expect(page.getByText('Showing 1–5 of 5')).toBeVisible()
  await expect(page.getByRole('row').nth(1).getByRole('cell').nth(6)).toContainText(
    /Jan 1.*12:00 AM/,
  )
})

test('arrived and no-show change a confirmed booking', async ({ page }) => {
  await page.goto(url)
  await page.getByRole('button', { name: 'Mark RSV-000004 arrived' }).click()
  await expect(page.getByText('RSV-000004 is now arrived')).toBeVisible()
  await expect(page.getByRole('row', { name: /RSV-000004/ })).toContainText('Arrived')
  await page.getByRole('button', { name: 'More actions for RSV-000005' }).click()
  await page.getByRole('button', { name: 'Mark RSV-000005 no-show' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: 'Go Back' }).click()
  await expect(page.getByRole('row', { name: /RSV-000005/ })).toContainText('Confirmed')
  await page.getByRole('button', { name: 'More actions for RSV-000005' }).click()
  await page.getByRole('button', { name: 'Mark RSV-000005 no-show' }).click()
  await dialog.getByRole('button', { name: 'Mark No-show' }).click()
  await expect(page.getByRole('row', { name: /RSV-000005/ })).toContainText('No-show')
  await page.getByRole('button', { name: 'Undo no-show for RSV-000005' }).click()
  await expect(page.getByRole('row', { name: /RSV-000005/ })).toContainText('Confirmed')
})

test('staff can cancel a booking after confirming', async ({ page }) => {
  await page.goto(url)
  await page.getByRole('button', { name: 'More actions for RSV-000004' }).click()
  await page.getByRole('button', { name: 'Cancel RSV-000004' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel Reservation' }).click()
  await expect(page.getByText('RSV-000004 is now cancelled')).toBeVisible()
  await expect(page.getByRole('row', { name: /RSV-000004/ })).toContainText('Cancelled')
})

test('staff can remove an unpaid booking, but not one with no deposit due', async ({ page }) => {
  await page.goto(url)
  await page.getByRole('button', { name: 'More actions for RSV-000004' }).click()
  await expect(page.getByRole('button', { name: 'Remove RSV-000004' })).toHaveCount(0)
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'More actions for RSV-000007' }).click()
  await page.getByRole('button', { name: 'Remove RSV-000007' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: 'Keep Booking' }).click()
  await expect(page.getByRole('row', { name: /RSV-000007/ })).toBeVisible()
  await page.getByRole('button', { name: 'More actions for RSV-000007' }).click()
  await page.getByRole('button', { name: 'Remove RSV-000007' }).click()
  await dialog.getByRole('button', { name: 'Remove Booking' }).click()
  await expect(page.getByText('RSV-000007 removed')).toBeVisible()
  await expect(page.getByRole('row', { name: /RSV-000007/ })).toHaveCount(0)
})

test('assign table lists tables that fit and confirms the booking', async ({ page }) => {
  await page.goto(url)
  await page.getByRole('button', { name: 'Assign a table to RSV-000007' }).click()
  const dialog = page.getByRole('dialog', { name: 'Assign a table' })
  await expect(dialog.getByRole('button', { name: /T1 / })).toHaveCount(0)
  await expect(dialog.getByRole('button', { name: /T5 Booked/ })).toBeDisabled()
  await dialog.getByRole('button', { name: /T6/ }).click()
  await expect(dialog).toHaveCount(0)
  const row = page.getByRole('row', { name: /RSV-000007/ })
  await expect(row).toContainText('T6')
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
  await page.getByLabel('Day').selectOption('cancelled')
  await expect(page.getByText('No reservations found.')).toBeVisible()
})

test('a booking that changes status flashes gold once', async ({ page }) => {
  await page.goto(url)
  const row = page.getByRole('row', { name: /RSV-000004/ })
  await expect(row).not.toHaveClass(/animate-flash/)
  await page.getByRole('button', { name: 'Mark RSV-000004 arrived' }).click()
  await expect(row).toHaveClass(/animate-flash/)
  await expect(row).not.toHaveClass(/animate-flash/)
  await expect(page.getByRole('row', { name: /RSV-000005/ })).not.toHaveClass(/animate-flash/)
})
