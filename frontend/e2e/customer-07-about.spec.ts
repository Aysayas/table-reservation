import { expect, test } from '@playwright/test'
import { logIn } from './logged-in.js'

test.beforeEach(({ page }) => logIn(page))

test('about page shows its sections', async ({ page }) => {
  await page.goto('/about')
  await expect(page.getByRole('heading', { name: 'About Us' })).toBeVisible()
  for (const name of [
    'A Taste Handed Down',
    'We cook our recipes the way they were taught to us.',
    'Plan Your Visit',
    'Opening Hours',
    'Location',
    'Contact',
  ]) {
    await expect(page.getByRole('heading', { name })).toBeVisible()
  }
  for (const value of ['Patience', 'Respect', 'Pride', 'Hospitality']) {
    await expect(page.getByText(value, { exact: true })).toBeVisible()
  }
})

test('hero buttons open the reserve and menu pages', async ({ page }) => {
  await page.goto('/about')
  const hero = page.getByRole('region', { name: 'Our heritage' })
  await hero.getByRole('link', { name: 'Reserve a Table' }).click()
  await expect(page).toHaveURL('/reserve')
  await page.goto('/about')
  await hero.getByRole('link', { name: 'View Menu' }).click()
  await expect(page).toHaveURL('/menu')
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
  await expect(
    page
      .locator('section', { has: page.getByRole('heading', { name: 'Opening Hours' }) })
      .getByText('10:00 AM – 10:00 PM'),
  ).toHaveCount(7)
})

test('today is highlighted once', async ({ page }) => {
  await page.goto('/about')
  await expect(page.getByText('Today', { exact: true })).toHaveCount(1)
})

test('contact details are shown', async ({ page }) => {
  await page.goto('/about')
  await expect(
    page
      .locator('section', { has: page.getByRole('heading', { name: 'Location' }) })
      .getByText('#08 Nautical Highway, Tawiran, Calapan City, Oriental Mindoro'),
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

test('get directions opens google maps directions', async ({ page }) => {
  await page.goto('/about')
  await expect(page.getByRole('link', { name: 'Get Directions', exact: true })).toHaveAttribute(
    'href',
    /google\.com\/maps\/dir\//,
  )
})

test('footer has the farewell line and quick links', async ({ page }) => {
  await page.goto('/about')
  const footer = page.locator('footer')
  await expect(footer.getByText('Salamat, and see you soon!')).toBeVisible()
  for (const [name, url] of [
    ['About Us', '/about'],
    ['Menu', '/menu'],
    ['Find My Reservation', '/reservation'],
    ['Staff Login', '/staff/login'],
  ]) {
    await expect(footer.getByRole('link', { name, exact: true })).toHaveAttribute('href', url)
  }
})
