import { expect, test } from '@playwright/test'
import { logIn } from './logged-in.js'

test.beforeEach(({ page }) => logIn(page))

test('hero shows the title, badge and buttons', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Mabuhay!')).toBeVisible()
  await expect(
    page.getByText('Family recipes, cooked the way they were taught to us'),
  ).toBeVisible()
  await expect(page.getByText('Open daily')).toBeVisible()
  await expect(page.getByText('10 AM – 10 PM')).toBeVisible()
  for (const feature of [
    'Fresh seafood',
    'Family recipes',
    'Filipino flavour',
    'Made with heart',
  ]) {
    await expect(page.getByText(feature, { exact: true })).toBeVisible()
  }
})

test('hero buttons open reserve and menu', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('main').getByRole('link', { name: 'Reserve a Table' }).click()
  await expect(page).toHaveURL('/reserve')
  await page.goto('/')
  await page.getByRole('link', { name: 'View Menu', exact: true }).click()
  await expect(page).toHaveURL('/menu')
})

test('story and dishes link to about and menu', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Read our story' }).click()
  await expect(page).toHaveURL('/about')
  await page.goto('/')
  await page.getByRole('link', { name: 'View full menu' }).click()
  await expect(page).toHaveURL('/menu')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page
    .getByRole('link', { name: /on the menu$/ })
    .first()
    .click()
  await expect(page).toHaveURL('/menu')
})

test('popular dishes slide gently and stand still with reduced motion', async ({ page }) => {
  await page.goto('/')
  const dishes = page.getByRole('link', { name: /on the menu$/ })
  await expect(dishes).toHaveCount(4)
  await expect(page.locator('ul.motion-safe\\:animate-marquee')).toHaveCSS(
    'animation-name',
    'marquee',
  )
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('ul.motion-safe\\:animate-marquee')).toHaveCSS('animation-name', 'none')
})

test('check availability passes date and guests to reserve', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Date').fill('2026-12-01')
  await expect(page.getByLabel('Time')).toHaveCount(0)
  await page.getByLabel('Guests').selectOption('4')
  await page.getByRole('button', { name: 'Check Availability' }).click()
  await expect(page).toHaveURL(/\/reserve|\/login/)
  expect(decodeURIComponent(page.url())).toContain('date=2026-12-01&pax=4')
})

test('the guests list stops at the most a booking allows', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByLabel('Guests').getByRole('option').last()).toHaveText('10 guests')
})

test('an unknown page says so and links home', async ({ page }) => {
  await page.goto('/no-such-page')
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
  await page.getByRole('main').getByRole('link', { name: 'Back to Home' }).click()
  await expect(page).toHaveURL('/')
})

test('footer has the quick links, hours and directions', async ({ page }) => {
  await page.goto('/')
  const footer = page.locator('footer')
  for (const [name, url] of [
    ['About Us', '/about'],
    ['Menu', '/menu'],
    ['Find My Reservation', '/reservation'],
    ['Staff Login', '/staff/login'],
  ]) {
    await expect(footer.getByRole('link', { name, exact: true })).toHaveAttribute('href', url)
  }
  await expect(footer.getByText('Monday – Sunday')).toBeVisible()
  await expect(footer.getByRole('link', { name: 'Get directions' })).toHaveAttribute(
    'href',
    /google\.com\/maps\/dir\//,
  )
})
