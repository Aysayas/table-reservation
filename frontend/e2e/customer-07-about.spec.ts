import { expect, test } from '@playwright/test'

test('about page shows its sections', async ({ page }) => {
  await page.goto('/about')
  await expect(page.getByRole('heading', { name: 'About Us' })).toBeVisible()
  for (const name of ['Our Story', 'Opening Hours', 'Location', 'Contact']) {
    await expect(page.getByRole('heading', { name })).toBeVisible()
  }
})

test('opening hours list every day', async ({ page }) => {
  await page.goto('/about')
  for (const day of [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ]) {
    await expect(page.getByText(day, { exact: true })).toBeVisible()
  }
  await expect(page.getByText('10:00 AM – 10:00 PM')).toHaveCount(7)
})

test('contact details are shown', async ({ page }) => {
  await page.goto('/about')
  await expect(
    page.getByText('#08 Nautical Highway, Tawiran, Calapan City, Oriental Mindoro'),
  ).toBeVisible()
  await expect(page.getByText('0918 957 2855')).toBeVisible()
  await expect(page.getByText('venciosgarden@yahoo.com')).toBeVisible()
  await expect(page.getByText('https://www.facebook.com/venciosgardenhotel')).toBeVisible()
})

test('back button returns to the previous page', async ({ page }) => {
  await page.goto('/menu')
  await page.getByRole('link', { name: 'About' }).click()
  await page.getByRole('button', { name: 'Back' }).click()
  await expect(page).toHaveURL('/menu')
})
