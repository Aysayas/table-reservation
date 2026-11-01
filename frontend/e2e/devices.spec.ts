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
