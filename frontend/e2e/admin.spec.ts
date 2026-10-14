import { expect, test } from '@playwright/test'

test('admin sidebar opens each section', async ({ page }) => {
  await page.goto('/admin')
  await page.getByRole('link', { name: 'Menu', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Menu Management' })).toBeVisible()
  await page.getByRole('link', { name: 'Settings' }).click()
  await expect(page).toHaveURL('/admin/settings')
})

test('log out returns to staff login', async ({ page }) => {
  await page.goto('/admin')
  await page.getByRole('link', { name: 'Log Out' }).click()
  await expect(page.getByRole('heading', { name: 'Staff Login' })).toBeVisible()
})
