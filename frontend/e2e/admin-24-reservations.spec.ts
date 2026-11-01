import { expect, test } from '@playwright/test'

const url = '/admin/reservations'

test('reservations shows upcoming bookings first, and the tabs switch the list', async ({
  page,
}) => {
  await page.goto(url)
  await expect(page.getByRole('heading', { name: 'Reservations', level: 1 })).toBeVisible()
  for (const column of ['Ref Code', 'Date', 'Time', 'Name', 'Guests', 'Table', 'Status']) {
    await expect(page.getByRole('columnheader', { name: column })).toBeVisible()
  }
  await expect(page.getByRole('button', { name: 'Upcoming' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  for (const code of ['RSV-000008', 'RSV-000009', 'RSV-000010']) {
    await expect(page.getByRole('cell', { name: code, exact: true })).toBeVisible()
  }
  await expect(page.getByText('Showing 1–3 of 3')).toBeVisible()

  await page.getByRole('button', { name: 'Today' }).click()
  await expect(page.getByRole('row')).toHaveCount(6)
  await page.getByRole('button', { name: 'Cancelled' }).click()
  await expect(page.getByText('No reservations found.')).toBeVisible()
})

test('search finds a booking, and status actions work from this page', async ({ page }) => {
  await page.goto(url)
  await page.getByLabel('Search').fill('RSV-000008')
  await expect(page.getByText('Showing 1–1 of 1')).toBeVisible()
  await page.getByLabel('Search').fill('')
  await page.getByRole('button', { name: 'Today' }).click()
  await page.getByRole('button', { name: 'Mark RSV-000004 arrived' }).click()
  await expect(page.getByRole('row', { name: /RSV-000004/ })).toContainText('Arrived')
  await page.getByRole('button', { name: 'Cancel RSV-000005' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Keep Reservation' }).click()
  await expect(page.getByRole('row', { name: /RSV-000005/ })).toContainText('Confirmed')
})

test('a confirmed booking can move to another table', async ({ page }) => {
  await page.goto(url)
  await page.getByRole('button', { name: 'Today' }).click()
  await page.getByRole('button', { name: 'Change the table for RSV-000005' }).click()
  const dialog = page.getByRole('dialog', { name: 'Assign a table' })
  await expect(dialog.getByRole('button', { name: /^T5/ })).toHaveCount(0)
  await dialog.getByRole('button', { name: /^T7/ }).click()
  await expect(dialog).toHaveCount(0)
  await expect(page.getByRole('row', { name: /RSV-000005/ })).toContainText('T7')
})

test('edit shows only for pending or confirmed bookings', async ({ page }) => {
  await page.goto(url)
  await expect(page.getByRole('button', { name: 'Edit RSV-000008' })).toBeVisible()
  await page.getByRole('button', { name: 'Today' }).click()
  await expect(page.getByRole('button', { name: 'Edit RSV-000003' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Edit RSV-000004' })).toBeVisible()
})

test('editing a booking saves the new guests and table', async ({ page }) => {
  await page.goto(url)
  await page.getByRole('button', { name: 'Edit RSV-000009' }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit RSV-000009' })
  await expect(dialog.getByLabel('Guests')).toHaveValue('4')
  await expect(dialog.getByLabel('Time')).toHaveValue('19:00:00')
  await dialog.getByLabel('Guests').fill('3')
  await dialog.getByLabel('Table').selectOption({ label: 'T5 · 4 seats' })
  await dialog.getByRole('button', { name: 'Save Changes' }).click()
  await expect(page.getByText('RSV-000009 updated')).toBeVisible()
  await expect(dialog).toHaveCount(0)
  await expect(page.getByRole('row', { name: /RSV-000009/ })).toContainText('3')
})

test('a small table and a table booked at that time cannot be picked', async ({ page }) => {
  await page.goto(url)
  await page.getByRole('button', { name: 'Edit RSV-000009' }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit RSV-000009' })
  await expect(dialog.getByRole('option', { name: 'T1 · 2 seats' })).toBeDisabled()
  await dialog.getByLabel('Table').selectOption({ label: 'T6 · 4 seats' })
  await dialog.getByRole('button', { name: 'Save Changes' }).click()
  await expect(page.getByText('RSV-000009 updated')).toBeVisible()

  await page.getByRole('button', { name: 'Edit RSV-000010' }).click()
  const second = page.getByRole('dialog', { name: 'Edit RSV-000010' })
  const date = await page
    .getByRole('row', { name: /RSV-000009/ })
    .getByRole('cell')
    .nth(1)
    .innerText()
  const iso = new Date(`${date} 12:00`).toLocaleDateString('en-CA')
  await second.getByLabel('Date').fill(iso)
  await second.getByLabel('Time').selectOption('19:00:00')
  await expect(second.getByRole('option', { name: 'T6 · booked' })).toBeDisabled()
})

test('guests above the limit are refused', async ({ page }) => {
  await page.goto(url)
  await page.getByRole('button', { name: 'Edit RSV-000008' }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit RSV-000008' })
  await dialog.getByLabel('Guests').fill('11')
  await dialog.getByRole('button', { name: 'Save Changes' }).click()
  await expect(page.getByText(/^Guests must be 1 to \d+$/)).toBeVisible()
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(dialog).toHaveCount(0)
})
