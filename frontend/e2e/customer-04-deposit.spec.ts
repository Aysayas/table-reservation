import { expect, test } from '@playwright/test'

const url = '/reserve/payment?code=RSV-000002'

test('deposit page shows the summary, amount and payment methods', async ({ page }) => {
  await page.goto(url)
  await expect(page.getByRole('heading', { name: 'Deposit Payment' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Reservation Summary' })).toBeVisible()
  await expect(page.getByText('January 1, 2026')).toBeVisible()
  await expect(page.getByText('7:30 PM')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Deposit Amount' })).toBeVisible()
  for (const name of ['GCash', 'Maya', 'Credit / Debit Card']) {
    await expect(page.getByRole('radio', { name })).toBeVisible()
  }
  await expect(page.getByRole('radio', { name: 'GCash' })).toBeChecked()
  await expect(page.getByRole('button', { name: 'Pay ₱0.00' })).toBeVisible()
})

test('choosing a payment method selects it', async ({ page }) => {
  await page.goto(url)
  await page.getByText('Maya').click()
  await expect(page.getByRole('radio', { name: 'Maya' })).toBeChecked()
  await expect(page.getByRole('radio', { name: 'GCash' })).not.toBeChecked()
})

test('pay goes to the confirmation page', async ({ page }) => {
  await page.goto(url)
  await page.getByRole('button', { name: 'Pay ₱0.00' }).click()
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
  await page.getByLabel('Full Name').fill('Juan Dela Cruz')
  await page.getByLabel('Mobile Number').fill('0912 345 6789')
  await page.getByRole('button', { name: 'Continue to Deposit' }).click()
  await expect(page.getByRole('heading', { name: 'Deposit Payment' })).toBeVisible()
  await expect(page.getByText('Juan Dela Cruz')).toBeVisible()
  await expect(page.getByText('7:00 PM')).toBeVisible()
})

test('a cancelled booking has no pay button', async ({ page }) => {
  await page.goto('/reservation')
  await page.getByLabel('Reference Code').fill('RSV-000001')
  await page.getByLabel('Mobile Number').fill('09000000000')
  await page.getByRole('button', { name: 'Find Reservation' }).click()
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(page.getByText('Reservation cancelled')).toBeVisible()
  await page.evaluate(
    `history.pushState({}, '', '/reserve/payment?code=RSV-000001'); dispatchEvent(new PopStateEvent('popstate'))`,
  )
  await expect(
    page.getByText("This reservation is no longer active, so there's nothing to pay."),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: /^Pay / })).toHaveCount(0)
  await page.getByRole('link', { name: 'View Reservation' }).click()
  await expect(page).toHaveURL('/reserve/confirmation/RSV-000001')
})
