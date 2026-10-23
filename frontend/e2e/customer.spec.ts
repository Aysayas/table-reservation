import { expect, test } from '@playwright/test'

test('home page loads', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible()
})

test('header links open the menu, reserve and about pages', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Open menu' }).click()
  await page.getByRole('link', { name: 'Menu' }).click()
  await expect(page).toHaveURL('/menu')
  await page.getByRole('link', { name: 'Reserve' }).click()
  await expect(page).toHaveURL('/reserve')
  await page.getByRole('button', { name: 'Open menu' }).click()
  await page.getByRole('link', { name: 'About' }).click()
  await expect(page).toHaveURL('/about')
})
