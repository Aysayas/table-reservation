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
    await expect(page.getByRole('cell', { name: code })).toBeVisible()
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
