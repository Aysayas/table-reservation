import { expect, test } from '@playwright/test'
import { logIn } from './logged-in.js'

test.beforeEach(({ page }) => logIn(page))

test('home page loads', async ({ page }) => {
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: 'Home-style Filipino, served with heart.' }),
  ).toBeVisible()
})

test('header links open the menu, reserve and about pages', async ({ page }) => {
  const header = page.getByRole('banner')
  await page.goto('/')
  await page.getByRole('button', { name: 'Open menu' }).click()
  await header.getByRole('link', { name: 'Menu', exact: true }).click()
  await expect(page).toHaveURL('/menu')
  await header.getByRole('link', { name: 'Reserve', exact: true }).click()
  await expect(page).toHaveURL('/reserve')
  await page.getByRole('button', { name: 'Open menu' }).click()
  await header.getByRole('link', { name: 'About', exact: true }).click()
  await expect(page).toHaveURL('/about')
})

test('each page names itself in the browser tab', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle("Vencio's Garden")
  await page.goto('/menu')
  await expect(page).toHaveTitle("Menu · Vencio's Garden")
})

test('keyboard users can skip to the page content', async ({ page }) => {
  await page.goto('/menu')
  await expect(page.getByRole('heading', { name: 'Our Menu' })).toBeVisible()
  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: 'Skip to content' })
  await expect(skip).toBeFocused()
  await skip.press('Enter')
  await expect(page.locator('main#main')).toBeFocused()
})
