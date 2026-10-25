import { expect, test } from '@playwright/test'

test('dashboard shows the sidebar, staff name and the four numbers', async ({ page }) => {
  await page.goto('/staff')
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible()
  const sidebar = page.getByRole('navigation', { name: 'Staff menu' })
  for (const name of ['Dashboard', 'Reservations', 'Table Status', 'Orders and Payments']) {
    await expect(sidebar.getByRole('link', { name, exact: true })).toBeVisible()
  }
  await expect(page.getByRole('button', { name: /Staff Name/ })).toBeVisible()
  for (const [label, value] of [
    ['Reservations Today', '5'],
    ['Guests Arrived', '2'],
    ['Active Orders', '3'],
    ['Available Tables', '1 / 8'],
  ]) {
    await expect(page.locator('dl > div', { hasText: label })).toContainText(value)
  }
})

test('the two lists show their columns and active orders', async ({ page }) => {
  await page.goto('/staff')
  const upcoming = page.getByRole('region', { name: 'Upcoming Reservations' })
  for (const column of ['Time', 'Name', 'Guests', 'Table', 'Status']) {
    await expect(upcoming.getByRole('columnheader', { name: column })).toBeVisible()
  }
  const orders = page.getByRole('region', { name: 'Active Orders' })
  await expect(orders.getByRole('row')).toHaveCount(4)
  await expect(orders.getByRole('row', { name: /#4 T8 2 ₱775.00 Ready/ })).toBeVisible()
})

test('view all opens the reservations and orders pages', async ({ page }) => {
  await page.goto('/staff')
  await page
    .getByRole('region', { name: 'Upcoming Reservations' })
    .getByRole('link', { name: 'View all' })
    .click()
  await expect(page).toHaveURL('/staff/reservations')
  await expect(
    page.locator('header').getByRole('heading', { name: "Today's Reservations" }),
  ).toBeVisible()
  await page.goto('/staff')
  await page
    .getByRole('region', { name: 'Active Orders' })
    .getByRole('link', { name: 'View all' })
    .click()
  await expect(page).toHaveURL('/staff/orders')
})

test('the staff menu logs out', async ({ page }) => {
  await page.goto('/staff')
  await page.getByRole('button', { name: /Staff Name/ }).click()
  await page.locator('header').getByRole('link', { name: 'Log Out' }).click()
  await expect(page).toHaveURL('/staff/login')
})
