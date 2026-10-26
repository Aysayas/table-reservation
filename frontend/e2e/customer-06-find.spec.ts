import { expect, test, type Page } from '@playwright/test'

const find = async (page: Page, code: string, mobile: string) => {
  await page.goto('/reservation')
  await page.getByLabel('Reference Code').fill(code)
  await page.getByLabel('Mobile Number').fill(mobile)
  await page.getByRole('button', { name: 'Find Reservation' }).click()
}

test('find page shows the form', async ({ page }) => {
  await page.goto('/reservation')
  await expect(page.getByRole('heading', { name: 'Find My Reservation' })).toBeVisible()
  await expect(page.getByLabel('Reference Code')).toBeVisible()
  await expect(page.getByLabel('Mobile Number')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Find Reservation' })).toBeVisible()
})

test('an empty form shows errors', async ({ page }) => {
  await page.goto('/reservation')
  await page.getByRole('button', { name: 'Find Reservation' }).click()
  await expect(page.getByText('Enter your reference code')).toBeVisible()
  await expect(page.getByText('Enter a mobile number like 0912 345 6789')).toBeVisible()
})

test('a wrong code or mobile shows not found', async ({ page }) => {
  await find(page, 'RSV-000001', '0912 345 6789')
  await expect(page.getByRole('alert')).toHaveText(
    "We couldn't find a reservation with that code and mobile number.",
  )
})

test('a matching code and mobile shows the reservation', async ({ page }) => {
  await find(page, 'rsv-000001', '0900 000 0000')
  await expect(page.getByRole('heading', { name: 'Reservation RSV-000001' })).toBeVisible()
  await expect(page.getByText('Confirmed', { exact: true })).toBeVisible()
  await expect(page.getByText('January 1, 2026')).toBeVisible()
  await expect(page.getByText('6:00 PM')).toBeVisible()
  await expect(page.getByText('T3', { exact: true })).toBeVisible()
})

test('cancel asks first, then marks the reservation cancelled', async ({ page }) => {
  await find(page, 'RSV-000001', '09000000000')
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(page.getByText('Cancelled', { exact: true })).toBeVisible()
  await expect(page.getByText('Reservation cancelled')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cancel', exact: true })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Reschedule' })).toBeDisabled()
})

test('reschedule opens reserve a table with the same guests', async ({ page }) => {
  await find(page, 'RSV-000001', '09000000000')
  await page.getByRole('button', { name: 'Reschedule' }).click()
  await expect(page).toHaveURL('/reserve?pax=4')
})
