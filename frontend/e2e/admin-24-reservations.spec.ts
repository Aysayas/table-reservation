import { expect, test } from '@playwright/test'

const url = '/admin/reservations'

test('reservations shows upcoming bookings first, and the tabs switch the list', async ({
  page,
}) => {
  await page.goto(url)
  await expect(page.getByRole('heading', { name: 'Reservations', level: 1 })).toBeVisible()
  for (const column of ['Ref Code', 'Date', 'Time', 'Name', 'Guests', 'Status']) {
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

test('opening time follows the opening hours and links to settings', async ({ page }) => {
  await page.goto(url)
  await expect(page.getByLabel('Opening Time for Booking')).toBeDisabled()
  await page.getByRole('link', { name: 'Set the hours in Settings' }).click()
  await expect(page).toHaveURL('/admin/settings')
})

test('reservation settings are saved and kept', async ({ page }) => {
  await page.goto(url)
  const settings = page.getByRole('region', { name: 'Reservation Settings' })
  await settings.getByLabel('Time Slot Length').selectOption('30')
  await settings.getByLabel('Max Guests per Booking').fill('8')
  await expect(settings.getByRole('switch', { name: 'Require Deposit' })).toHaveAttribute(
    'aria-checked',
    'true',
  )
  await settings.getByLabel('Deposit Amount (₱) per guest').fill('100')
  await settings.getByRole('button', { name: 'Save Settings' }).click()
  await expect(page.getByText('Settings saved')).toBeVisible()

  await page.getByRole('link', { name: 'Dashboard' }).click()
  await page.getByRole('link', { name: 'Reservations' }).click()
  await expect(settings.getByLabel('Time Slot Length')).toHaveValue('30')
  await expect(settings.getByLabel('Max Guests per Booking')).toHaveValue('8')
  await expect(settings.getByLabel('Deposit Amount (₱) per guest')).toHaveValue('100')
})

test('the deposit amount turns off with the switch, and max guests must be at least 1', async ({
  page,
}) => {
  await page.goto(url)
  const settings = page.getByRole('region', { name: 'Reservation Settings' })
  await settings.getByRole('switch', { name: 'Require Deposit' }).click()
  await expect(settings.getByLabel('Deposit Amount (₱) per guest')).toBeDisabled()
  await settings.getByLabel('Max Guests per Booking').fill('0')
  await settings.getByRole('button', { name: 'Save Settings' }).click()
  await expect(page.getByText('At least 1 guest')).toBeVisible()
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

test('a small table cannot be picked, and a booked table is refused', async ({ page }) => {
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
  await second.getByLabel('Table').selectOption({ label: 'T6 · 4 seats' })
  await second.getByRole('button', { name: 'Save Changes' }).click()
  await expect(page.getByText('That table is already booked at this time')).toBeVisible()
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
