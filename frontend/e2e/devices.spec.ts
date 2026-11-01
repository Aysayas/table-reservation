import { expect, test } from '@playwright/test'

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
