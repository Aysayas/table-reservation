import { expect, test } from '@playwright/test'
import { logIn } from './logged-in.js'

test.beforeEach(({ page }) => logIn(page))

const nextYear = new Date().getFullYear() + 1
const date = `${nextYear}-12-01`

test('reserve page shows the steps and the form', async ({ page }) => {
  await page.goto('/reserve')
  await expect(page.getByRole('heading', { name: 'Reserve a Table' })).toBeVisible()
  for (const step of ['Details', 'Deposit', 'Confirm']) {
    await expect(page.getByText(step, { exact: true })).toBeVisible()
  }
  for (const name of ['Date', 'Special Request (optional)']) {
    await expect(page.getByLabel(name)).toBeVisible()
  }
  await expect(page.getByText(/^Booking as Customer Name/)).toBeVisible()
  await expect(page.getByLabel('Full Name')).toBeHidden()
  await expect(page.getByLabel('Mobile Number')).toBeHidden()
  await expect(page.getByRole('group', { name: 'Number of Guests' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Continue to Deposit' })).toBeVisible()
})

test('guest buttons change the number of guests', async ({ page }) => {
  await page.goto('/reserve')
  const guests = page.getByRole('group', { name: 'Number of Guests' })
  await expect(guests.getByRole('status')).toHaveText('2')
  await page.getByRole('button', { name: 'More guests' }).click()
  await expect(guests.getByRole('status')).toHaveText('3')
  await page.getByRole('button', { name: 'Fewer guests' }).click()
  await page.getByRole('button', { name: 'Fewer guests' }).click()
  await expect(guests.getByRole('status')).toHaveText('1')
  await expect(page.getByRole('button', { name: 'Fewer guests' })).toBeDisabled()
})

test('home values fill in the date, guests and time', async ({ page }) => {
  await page.goto(`/reserve?date=${date}&time=18:00&pax=4`)
  await expect(page.getByLabel('Date')).toHaveValue(date)
  await expect(
    page.getByRole('group', { name: 'Number of Guests' }).getByRole('status'),
  ).toHaveText('4')
  await expect(page.getByRole('button', { name: '6:00 PM' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('guests from the link are kept to a whole number within the limit', async ({ page }) => {
  const guests = page.getByRole('group', { name: 'Number of Guests' }).getByRole('status')
  await page.goto('/reserve?pax=99')
  await expect(guests).toHaveText('10')
  await page.goto('/reserve?pax=2.5')
  await expect(guests).toHaveText('2')
  await page.goto('/reserve?pax=-3')
  await expect(guests).toHaveText('1')
})

test('an empty form shows errors and stays on the page', async ({ page }) => {
  await page.goto('/reserve')
  await page.getByRole('button', { name: 'Continue to Deposit' }).click()
  await expect(page.getByText('Choose a date', { exact: true })).toBeVisible()
  await expect(page.getByText('Choose a time')).toBeVisible()
  await expect(page).toHaveURL('/reserve')
})

test('a full form continues to the deposit page', async ({ page }) => {
  await page.goto('/reserve')
  await page.getByLabel('Date').fill(date)
  await page.getByRole('button', { name: '7:00 PM' }).click()
  await page.getByRole('button', { name: 'Continue to Deposit' }).click()
  await expect(page).toHaveURL(/\/reserve\/payment\?code=RSV-[A-Z0-9]{6}$/)
})

test('reschedule mode shows the code and keeps the booking guests', async ({ page }) => {
  await page.goto('/reserve?reschedule=RSV-000001')
  await expect(page.getByRole('heading', { name: 'Reschedule RSV-000001' })).toBeVisible()
  await expect(page.getByRole('group', { name: 'Number of Guests' })).toContainText('4')
  await expect(page.getByRole('button', { name: 'More guests' })).toBeDisabled()
  await expect(page.getByLabel('Full Name')).toBeHidden()
  await expect(page.getByLabel('Mobile Number')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Confirm New Time' })).toBeVisible()
})

test('reschedule mode shows the current booking', async ({ page }) => {
  await page.goto('/reserve?reschedule=RSV-000001')
  await expect(page.getByText(/^Currently: /)).toBeVisible()
})

test('a reschedule link with an unknown code shows not found', async ({ page }) => {
  await page.goto('/reserve?reschedule=RSV-XXXXXX')
  await expect(page.getByRole('heading', { name: 'Reservation not found' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Confirm New Time' })).toHaveCount(0)
  await page.getByRole('link', { name: 'Find My Reservation' }).last().click()
  await expect(page).toHaveURL('/reservation')
})

test('refreshing keeps what the guest filled in', async ({ page }) => {
  await page.goto(`/reserve?date=${date}`)
  await page.getByRole('button', { name: 'More guests' }).click()
  await page.getByRole('button', { name: '7:00 PM' }).click()
  await page.getByLabel('Special Request (optional)').fill('Window seat')
  await page.reload()
  await expect(page.getByLabel('Date')).toHaveValue(date)
  await expect(page.locator('output')).toHaveText('3')
  await expect(page.getByRole('button', { name: '7:00 PM' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(page.getByLabel('Special Request (optional)')).toHaveValue('Window seat')
})

test('rescheduling moves the booking and opens its confirmation', async ({ page }) => {
  await page.goto('/reserve?reschedule=RSV-000001')
  await page.getByLabel('Date').fill(date)
  await page.getByRole('button', { name: '7:00 PM' }).click()
  await page.getByLabel('Mobile Number').fill('09000000000')
  await page.getByRole('button', { name: 'Confirm New Time' }).click()
  await expect(page.getByText('Your reservation was moved')).toBeVisible()
  await expect(page).toHaveURL('/reserve/confirmation/RSV-000001')
  await expect(page.getByText('Dec 1, ' + nextYear)).toBeVisible()
  await expect(page.getByText('7:00 PM')).toBeVisible()
})

test('rescheduling with the wrong mobile number shows an error', async ({ page }) => {
  await page.goto('/reserve?reschedule=RSV-000001')
  await page.getByLabel('Date').fill(date)
  await page.getByRole('button', { name: '7:00 PM' }).click()
  await page.getByLabel('Mobile Number').fill('09111111111')
  await page.getByRole('button', { name: 'Confirm New Time' }).click()
  await expect(page.getByText('Reservation not found')).toBeVisible()
  await expect(page).toHaveURL('/reserve?reschedule=RSV-000001')
})

test('the mobile field has a fixed +63 and cleans typed or pasted numbers', async ({ page }) => {
  await page.goto('/reserve?reschedule=RSV-000001')
  const mobile = page.getByLabel('Mobile Number')
  await expect(page.getByText('+63', { exact: true })).toBeVisible()
  await expect(mobile).toHaveAttribute('placeholder', '912 345 6789')
  await mobile.fill('0912 345 6789')
  await expect(mobile).toHaveValue('9123456789')
  await mobile.fill('+63 912 345 6789')
  await expect(mobile).toHaveValue('9123456789')
  await mobile.fill('639123456789')
  await expect(mobile).toHaveValue('9123456789')
})

test('a short mobile number shows a friendly error', async ({ page }) => {
  await page.goto('/reserve?reschedule=RSV-000001')
  await page.getByLabel('Mobile Number').fill('12345')
  await page.getByRole('button', { name: 'Confirm New Time' }).click()
  await expect(page.getByText('Check your mobile number')).toBeVisible()
})

test('a group bigger than every table gets an explanation', async ({ page }) => {
  await page.goto(`/reserve?date=${date}&pax=9`)
  await expect(page.getByText("We can't seat 9 guests online on this day")).toBeVisible()
  await expect(page.getByRole('link', { name: '0918 957 2855' })).toHaveAttribute(
    'href',
    'tel:09189572855',
  )
})

test('6 guests can book, because T9 seats 8', async ({ page }) => {
  await page.goto(`/reserve?date=${date}&pax=6`)
  await expect(page.getByRole('button', { name: '7:00 PM' })).toBeEnabled()
  await expect(page.getByText(/We can't seat/)).toHaveCount(0)
})
