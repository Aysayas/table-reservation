import { expect, test } from '@playwright/test'

const url = '/reserve/confirmation/RSV-000001'

test('confirmation shows the reservation', async ({ page }) => {
  await page.goto(url)
  await expect(page.getByRole('heading', { name: 'Your table is reserved' })).toBeVisible()
  await expect(page.getByText('A confirmation SMS was sent to 09XX XXX 0000')).toBeVisible()
  await expect(page.getByText('RSV-000001')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Details' })).toBeVisible()
  await expect(page.getByText('Thu, Jan 1, 2026')).toBeVisible()
  await expect(page.getByText('6:00 PM')).toBeVisible()
  await expect(page.getByText('₱0.00')).toBeVisible()
  await expect(page.getByText('Confirmed', { exact: true })).toBeVisible()
})

test('back to home goes to the home page', async ({ page }) => {
  await page.goto(url)
  await page.getByRole('link', { name: 'Back to Home' }).click()
  await expect(page).toHaveURL('/')
})

test('manage reservation goes to find reservation', async ({ page }) => {
  await page.goto(url)
  await page.getByRole('link', { name: 'Manage Reservation' }).click()
  await expect(page).toHaveURL('/reservation')
})

test('unknown code shows not found', async ({ page }) => {
  await page.goto('/reserve/confirmation/RSV-999999')
  await expect(page.getByRole('heading', { name: 'Reservation not found' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Back to Home' })).toBeVisible()
})

test('copy code copies the reference code', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto(url)
  await page.getByRole('button', { name: 'Copy code' }).click()
  await expect(page.getByText('Code copied')).toBeVisible()
  expect(await page.evaluate('navigator.clipboard.readText()')).toBe('RSV-000001')
})
