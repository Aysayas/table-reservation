import { expect, test } from '@playwright/test'

test('admin sidebar opens each section', async ({ page }) => {
  await page.goto('/admin')
  const sidebar = page.getByRole('navigation', { name: 'Admin menu' })
  for (const group of ['Today', 'Menu & Tables', 'Sales', 'Setup']) {
    await expect(sidebar.getByText(group, { exact: true })).toBeVisible()
  }
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

test('an unknown admin page shows not found inside the dashboard', async ({ page }) => {
  await page.goto('/admin/nope')
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Admin menu' })).toBeVisible()
  await page.getByRole('link', { name: 'Back to Dashboard' }).click()
  await expect(page).toHaveURL('/admin')
  await expect(page).toHaveTitle("Admin Dashboard · Vencio's Garden")
})
