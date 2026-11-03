import { expect, test } from '@playwright/test'
import { logIn } from './logged-in.js'

const fieldSizes = (page: import('@playwright/test').Page) =>
  page.evaluate<number[]>(
    `[...document.querySelectorAll('input, select, textarea')]
      .filter((f) => f.getBoundingClientRect().width > 1)
      .map((f) => parseFloat(getComputedStyle(f).fontSize))`,
  )

for (const path of ['/login', '/register', '/reservation', '/staff/login', '/admin/settings']) {
  test(`fields on ${path} are big enough that the phone does not zoom in`, async ({ page }) => {
    await page.goto(path)
    await expect(page.locator('input:visible').first()).toBeVisible()
    const sizes = await fieldSizes(page)
    expect(sizes.length).toBeGreaterThan(0)
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(16)
  })
}

test('date fields keep a usable size even when empty', async ({ page }) => {
  await page.goto('/')
  const date = page.getByLabel('Date')
  await date.scrollIntoViewIfNeeded()
  const box = await date.boundingBox()
  expect(box?.height).toBeGreaterThanOrEqual(44)
  expect(box?.width).toBeGreaterThanOrEqual(120)
})

test('the page lets you pinch to zoom', async ({ page }) => {
  await page.goto('/')
  const viewport = await page.locator('meta[name="viewport"]').getAttribute('content')
  expect(viewport).toContain('viewport-fit=cover')
  expect(viewport).not.toContain('user-scalable=no')
  expect(viewport).not.toContain('maximum-scale')
})

test('a guest can book on a touch phone by tapping', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('sample-account', '100'))
  await page.goto('/reserve?date=2030-12-01')
  await page.getByRole('button', { name: '7:00 PM' }).tap()
  await page.getByRole('button', { name: 'Continue to Deposit' }).tap()
  await expect(page.getByRole('heading', { name: 'Deposit Payment' })).toBeVisible()
})

const dashboardPages = [
  '/staff',
  '/staff/reservations',
  '/staff/tables',
  '/staff/orders?order=1',
  '/admin',
  '/admin/menu',
  '/admin/reservations',
  '/admin/orders',
  '/admin/payments',
  '/admin/reports',
  '/admin/users',
]

for (const path of dashboardPages) {
  for (const [shape, flip] of [
    ['upright', false],
    ['sideways', true],
  ] as const) {
    test(`${path} fits the screen held ${shape}`, async ({ page, viewport }) => {
      const { width, height } = viewport!
      await page.setViewportSize(flip ? { width: height, height: width } : { width, height })
      await page.goto(path)
      await expect(page.getByRole('main')).toBeVisible()
      await expect(page.getByRole('main').locator('h2, table, ul, dl').first()).toBeVisible()
      const main = await page.getByRole('main').boundingBox()
      expect(main?.width).toBeGreaterThanOrEqual(flip ? 700 : 380)
      const pageWidth = await page.evaluate<number>('document.documentElement.scrollWidth')
      expect(pageWidth).toBeLessThanOrEqual(flip ? height : width)
    })
  }
}

test('the staff menu slides in, reaches every link and closes', async ({ page, viewport }) => {
  const { width, height } = viewport!
  await page.setViewportSize({ width: height, height: width })
  await page.goto('/admin')
  const menu = page.getByRole('navigation', { name: 'Admin menu' })
  await expect(menu).toBeHidden()

  await page.getByRole('button', { name: 'Open menu' }).tap()
  await expect(page.getByRole('button', { name: 'Close menu' })).toBeFocused()
  const logOut = page.getByRole('link', { name: 'Log Out' })
  await logOut.scrollIntoViewIfNeeded()
  await expect(logOut).toBeInViewport()

  await page.keyboard.press('Escape')
  await expect(menu).toBeHidden()
  await expect(page.getByRole('button', { name: 'Open menu' })).toBeFocused()

  await page.getByRole('button', { name: 'Open menu' }).tap()
  await menu.getByRole('link', { name: 'Menu' }).first().tap()
  await expect(page).toHaveURL('/admin/menu')
  await expect(menu).toBeHidden()
})

test('a tall dialog scrolls so its buttons can be reached sideways', async ({ page, viewport }) => {
  const { width, height } = viewport!
  await page.setViewportSize({ width: height, height: width })
  await page.goto('/admin/users')
  await page.getByRole('button', { name: /Add Staff/ }).click()
  const dialog = page.getByRole('dialog')
  const box = await dialog.boundingBox()
  expect(box?.y).toBeGreaterThanOrEqual(0)
  expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(width)
  const save = dialog.getByRole('button', { name: 'Save Staff' })
  await save.scrollIntoViewIfNeeded()
  await expect(save).toBeInViewport()
})

test('the bottom button joins the page on short screens', async ({ page, viewport }) => {
  const { width, height } = viewport!
  await page.goto('/table/5?t=sample-qr-token-5')
  await page.getByRole('button', { name: 'Add Bulalo' }).click()
  await page.goto('/table/5/cart')
  const bar = page.getByRole('link', { name: /Checkout/ }).locator('..')
  await expect(bar).toHaveCSS('position', 'fixed')
  await page.setViewportSize({ width: height, height: width })
  await expect(bar).toHaveCSS('position', 'static')
})

test('the Settings save bar is solid and reachable', async ({ page }) => {
  await page.goto('/admin/settings')
  const save = page.getByRole('button', { name: 'Save Changes' })
  await expect(save).toBeInViewport()
  await expect(save.locator('..')).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
})

test('guest pages fill a sideways phone', async ({ page, viewport }) => {
  const { width, height } = viewport!
  await page.setViewportSize({ width: height, height: width })
  await page.goto('/about')
  const main = await page.getByRole('main').boundingBox()
  expect(main?.width).toBeGreaterThanOrEqual(height - 2)
})

test('table pages sit on cream at wide sizes', async ({ page, viewport }) => {
  const { width, height } = viewport!
  await page.setViewportSize({ width: height, height: width })
  await page.goto('/table/5?t=sample-qr-token-5')
  const backdrop = page.locator('div[aria-hidden="true"].fixed.inset-0')
  await expect(backdrop).toHaveCount(1)
  await expect(backdrop).toHaveClass(/bg-brand-cream/)
})

test('the About page fits a small phone', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 })
  await page.goto('/about')
  await expect(page.getByRole('main')).toBeVisible()
  const pageWidth = await page.evaluate<number>('document.documentElement.scrollWidth')
  expect(pageWidth).toBeLessThanOrEqual(360)
})

test('the Home date field stays in its own column and matches Guests', async ({ page }) => {
  await page.goto('/')
  const date = await page.getByLabel('Date').boundingBox()
  const guests = await page.getByLabel('Guests').boundingBox()
  expect((date?.x ?? 0) + (date?.width ?? 0)).toBeLessThanOrEqual(guests?.x ?? 0)
  expect(date?.height).toBe(guests?.height)
})

test('header and page buttons are big enough to tap', async ({ page }) => {
  await page.goto('/table/5/cart')
  for (const name of ['Open menu', 'Back']) {
    const box = await page.getByRole('button', { name }).first().boundingBox()
    expect(box?.height).toBeGreaterThanOrEqual(44)
    expect(box?.width).toBeGreaterThanOrEqual(44)
  }
  const cart = await page.getByRole('link', { name: /^Cart,/ }).boundingBox()
  expect(cart?.height).toBeGreaterThanOrEqual(44)
})

test('the open menu is not covered by the category chips', async ({ page }) => {
  await page.goto('/table/5?t=sample-qr-token-5')
  await page.getByRole('button', { name: 'Open menu' }).click()
  await page.getByRole('link', { name: 'About', exact: true }).click()
  await expect(page).toHaveURL(/\/about$/)
})

test('the logged-in header keeps its right gutter from 380 wide', async ({ page }) => {
  await logIn(page)
  for (const width of [380, 390, 412]) {
    await page.setViewportSize({ width, height: 800 })
    await page.goto('/')
    const box = await page.getByRole('button', { name: 'Open menu' }).boundingBox()
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(width - 12)
  }
})

test('the wide header button keeps the space in Reserve a Table', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  const words = page
    .getByRole('banner')
    .getByRole('link', { name: 'Reserve a Table' })
    .getByText('a Table')
  const widths = await words.evaluate((el) => {
    const withSpace = el.getBoundingClientRect().width
    el.textContent = 'a Table'
    return { withSpace, without: el.getBoundingClientRect().width }
  })
  expect(widths.withSpace).toBeGreaterThan(widths.without)
})

test('the logged-in phone header keeps space between its buttons', async ({ page }) => {
  await logIn(page)
  await page.setViewportSize({ width: 360, height: 780 })
  await page.goto('/')
  const banner = page.getByRole('banner')
  const home = await banner.getByRole('link').first().boundingBox()
  const reserve = await banner.getByRole('link', { name: /^Reserve/ }).boundingBox()
  const menu = await banner.getByRole('button', { name: 'Open menu' }).boundingBox()
  expect((home?.x ?? 0) + (home?.width ?? 0)).toBeLessThanOrEqual((reserve?.x ?? 0) - 8)
  expect((reserve?.x ?? 0) + (reserve?.width ?? 0)).toBeLessThanOrEqual((menu?.x ?? 0) - 8)
  expect(home?.height).toBeGreaterThanOrEqual(44)
  const clipped = await banner
    .getByRole('link')
    .first()
    .evaluate((link) => {
      const name = link.querySelector('span.whitespace-nowrap')
      return name ? name.scrollWidth > name.clientWidth : false
    })
  expect(clipped).toBe(false)
})
