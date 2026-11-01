import { expect, test } from '@playwright/test'
import { logIn } from './logged-in.js'

test.beforeEach(({ page }) => logIn(page))

const url = '/reserve/payment?code=RSV-000002'

test('deposit page shows the summary and amount, and leaves the method to the next screen', async ({
  page,
}) => {
  await page.goto(url)
  await expect(page.getByRole('heading', { name: 'Deposit Payment' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Reservation Summary' })).toBeVisible()
  await expect(page.getByText('January 1, 2026')).toBeVisible()
  await expect(page.getByText('7:30 PM')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Deposit Amount' })).toBeVisible()
  await expect(page.getByRole('radio')).toHaveCount(0)
  await expect(page.getByText('No deposit is needed for this booking.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible()
})

test('deposit page shows the reference code to save', async ({ page }) => {
  await page.goto('/reserve/payment?code=RSV-000001')
  await expect(page.getByRole('definition').filter({ hasText: 'RSV-000001' })).toBeVisible()
  await expect(page.getByText(/^Save this code/)).toBeVisible()
})

test('continue goes to the confirmation page', async ({ page }) => {
  await page.goto(url)
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page).toHaveURL('/reserve/confirmation/RSV-000002')
})

test('a missing code shows not found with a link to reserve', async ({ page }) => {
  await page.goto('/reserve/payment')
  await expect(page.getByRole('heading', { name: 'Reservation not found' })).toBeVisible()
  await page.getByRole('main').getByRole('link', { name: 'Reserve a Table' }).click()
  await expect(page).toHaveURL('/reserve')
})

test('booking on screen 03 opens this page with the new reservation', async ({ page }) => {
  const date = `${new Date().getFullYear() + 1}-12-01`
  await page.goto('/reserve')
  await page.getByLabel('Date').fill(date)
  await page.getByRole('button', { name: '7:00 PM' }).click()
  await page.getByRole('button', { name: 'Continue to Deposit' }).click()
  await expect(page.getByRole('heading', { name: 'Deposit Payment' })).toBeVisible()
  await expect(page.getByText('Customer Name')).toBeVisible()
  await expect(page.getByText('7:00 PM')).toBeVisible()
  await expect(
    page.getByText("You'll choose GCash, Maya or card on the next screen."),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Pay ₱200.00' })).toBeVisible()
})

test('going back from the deposit page does not return to the booking form', async ({ page }) => {
  await page.goto('/')
  await page.goto('/reserve')
  await page.getByLabel('Date').fill(`${new Date().getFullYear() + 1}-12-01`)
  await page.getByRole('button', { name: '7:00 PM' }).click()
  await page.getByRole('button', { name: 'Continue to Deposit' }).click()
  await expect(page.getByRole('heading', { name: 'Deposit Payment' })).toBeVisible()
  await page.getByRole('button', { name: 'Back' }).click()
  await expect(page).toHaveURL('/')
})

test('a cancelled booking has no pay button', async ({ page }) => {
  await page.goto('/reservation')
  await page.getByLabel('Reference Code').fill('RSV-000004')
  await page.getByLabel('Mobile Number').fill('09000000000')
  await page.getByRole('button', { name: 'Find Reservation' }).click()
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(page.getByText('Reservation cancelled')).toBeVisible()
  await page.evaluate(
    `history.pushState({}, '', '/reserve/payment?code=RSV-000004'); dispatchEvent(new PopStateEvent('popstate'))`,
  )
  await expect(
    page.getByText("This reservation is no longer active, so there's nothing to pay."),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: /^Pay / })).toHaveCount(0)
  await page.getByRole('link', { name: 'View Reservation' }).click()
  await expect(page).toHaveURL('/reserve/confirmation/RSV-000004')
})

test('a paid deposit has no pay button', async ({ page }) => {
  await page.goto('/reserve/payment?code=RSV-000001')
  await expect(page.getByText('This deposit is already paid.')).toBeVisible()
  await expect(page.getByRole('button', { name: /^Pay / })).toHaveCount(0)
})
