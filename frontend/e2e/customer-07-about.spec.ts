import { expect, test } from '@playwright/test'

test('about page shows its sections', async ({ page }) => {
  await page.goto('/about')
  await expect(page.getByRole('heading', { name: 'About Us' })).toBeVisible()
  for (const name of ['A Taste Handed Down', 'Opening Hours', 'Location', 'Contact']) {
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

test('today is highlighted once', async ({ page }) => {
  await page.goto('/about')
  await expect(page.getByText('Today', { exact: true })).toHaveCount(1)
})

test('contact details are shown', async ({ page }) => {
  await page.goto('/about')
  await expect(
    page.getByText('#08 Nautical Highway, Tawiran, Calapan City, Oriental Mindoro'),
  ).toBeVisible()
  await expect(page.getByText('0918 957 2855')).toBeVisible()
  await expect(page.getByText('venciosgarden@yahoo.com')).toBeVisible()
  await expect(page.getByRole('link', { name: '/venciosgardenhotel' })).toHaveAttribute(
    'href',
    'https://www.facebook.com/venciosgardenhotel',
  )
  await expect(page.getByRole('link', { name: '0918 957 2855' })).toHaveAttribute(
    'href',
    'tel:09189572855',
  )
})

test('breadcrumb home link returns to the home page', async ({ page }) => {
  await page.goto('/about')
  await page
    .getByRole('navigation', { name: 'Breadcrumb' })
    .getByRole('link', { name: 'Home' })
    .click()
  await expect(page).toHaveURL('/')
})
