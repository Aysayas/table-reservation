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
  await expect(page.getByText('Check your mobile number')).toBeVisible()
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
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel Reservation' }).click()
  await expect(page.getByText('Cancelled', { exact: true })).toBeVisible()
  await expect(page.getByText('Reservation cancelled')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cancel', exact: true })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Reschedule' })).toBeDisabled()
})

test('reschedule opens reserve a table in reschedule mode with the mobile filled in', async ({
  page,
}) => {
  await find(page, 'RSV-000001', '09000000000')
  await page.getByRole('button', { name: 'Reschedule' }).click()
  await expect(page).toHaveURL('/reserve?reschedule=RSV-000001')
  await expect(page.getByLabel('Mobile Number')).toHaveValue('9000000000')
})

test('a pasted +63 number finds the reservation', async ({ page }) => {
  await find(page, 'RSV-000001', '+63 900 000 0000')
  await expect(page.getByText('RSV-000001')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible()
})

test('keep reservation closes the dialog and changes nothing', async ({ page }) => {
  await find(page, 'RSV-000001', '09000000000')
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  await page.getByRole('button', { name: 'Keep Reservation' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByText('Confirmed', { exact: true })).toBeVisible()
})

test('the result shows the deposit', async ({ page }) => {
  await find(page, 'RSV-000001', '09000000000')
  await expect(page.getByText('Deposit', { exact: true })).toBeVisible()
  await expect(page.getByText('None', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Pay Deposit' })).toHaveCount(0)
})

test('going back from reschedule keeps the result, with no mobile in the link', async ({
  page,
}) => {
  await find(page, 'RSV-000001', '09000000000')
  await expect(page).toHaveURL('/reservation?code=RSV-000001')
  await page.getByRole('button', { name: 'Reschedule' }).click()
  await expect(page).toHaveURL('/reserve?reschedule=RSV-000001')
  await page.goBack()
  await expect(page.getByRole('heading', { name: 'Reservation RSV-000001' })).toBeVisible()
  await expect(page.getByLabel('Reference Code')).toHaveValue('RSV-000001')
})

test('manage reservation fills in the code for a logged-out guest', async ({ page }) => {
  await page.goto('/reserve/confirmation/RSV-000001')
  await page.getByRole('link', { name: 'Manage Reservation' }).click()
  await expect(page).toHaveURL('/reservation?code=RSV-000001')
  await expect(page.getByLabel('Reference Code')).toHaveValue('RSV-000001')
})
