import { expect, test } from '@playwright/test'
import { logIn } from './logged-in.js'

test.beforeEach(({ page }) => logIn(page))

const url = '/reserve/confirmation/RSV-000001'

test('confirmation shows the reservation', async ({ page }) => {
  await page.goto(url)
  await expect(page.getByRole('heading', { name: 'Your table is reserved' })).toBeVisible()
  await expect(page.getByText('Salamat!')).toBeVisible()
  await expect(page.getByText(/SMS/)).toHaveCount(0)
  await expect(page.getByText('RSV-000001', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Details' })).toBeVisible()
  await expect(page.getByText('Thu, Jan 1, 2026')).toBeVisible()
  await expect(page.getByText('6:00 PM')).toBeVisible()
  await expect(page.getByText('₱0.00')).toBeVisible()
  await expect(page.getByText('Confirmed', { exact: true })).toBeVisible()
})

test('back to home goes to the home page', async ({ page }) => {
  await page.goto(url)
  await page.getByRole('link', { name: 'Back to Home' }).click()
  await expect(page).toHaveURL('/')
})

test('manage reservation goes to find reservation', async ({ page }) => {
  await page.goto(url)
  await page.getByRole('link', { name: 'Manage Reservation' }).click()
  await expect(page).toHaveURL('/reservation')
})

test('unknown code shows not found', async ({ page }) => {
  await page.goto('/reserve/confirmation/RSV-999999')
  await expect(page.getByRole('heading', { name: 'Reservation not found' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Back to Home' })).toBeVisible()
})

test('copy code copies the reference code', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto(url)
  await page.getByRole('button', { name: 'Copy code' }).click()
  await expect(page.getByText('Code copied')).toBeVisible()
  expect(await page.evaluate('navigator.clipboard.readText()')).toBe('RSV-000001')
})

test('calendar downloads the reservation as an ics file', async ({ page }) => {
  await page.goto(url)
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Calendar' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('RSV-000001.ics')
})

test('directions opens google maps directions', async ({ page }) => {
  await page.goto(url)
  await expect(page.getByRole('link', { name: 'Directions', exact: true })).toHaveAttribute(
    'href',
    /google\.com\/maps\/dir\//,
  )
})

test('what happens next lists the steps', async ({ page }) => {
  await page.goto(url)
  await expect(page.getByRole('heading', { name: 'What happens next' })).toBeVisible()
  for (const step of ['Arrive and show your code', 'Scan and order']) {
    await expect(page.getByText(step, { exact: true })).toBeVisible()
  }
  await expect(page.getByText('Give RSV-000001 to our staff when you arrive.')).toBeVisible()
})

test('the footer has the quick links, hours and directions', async ({ page }) => {
  await page.goto(url)
  const footer = page.locator('footer')
  for (const [name, href] of [
    ['About Us', '/about'],
    ['Menu', '/menu'],
    ['Find My Reservation', '/reservation'],
    ['Staff Login', '/staff/login'],
  ]) {
    await expect(footer.getByRole('link', { name, exact: true })).toHaveAttribute('href', href)
  }
  await expect(footer.getByText('Monday – Sunday')).toBeVisible()
  await expect(footer.getByRole('link', { name: 'Get directions' })).toHaveAttribute(
    'href',
    /google\.com\/maps\/dir\//,
  )
})

const openInApp = (page: import('@playwright/test').Page, path: string) =>
  page.evaluate(
    `history.pushState({}, '', '${path}'); dispatchEvent(new PopStateEvent('popstate'))`,
  )

test('a cancelled reservation says it was cancelled', async ({ page }) => {
  await page.goto('/reservation')
  await page.getByLabel('Reference Code').fill('RSV-000001')
  await page.getByLabel('Mobile Number').fill('09000000000')
  await page.getByRole('button', { name: 'Find Reservation' }).click()
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(page.getByText('Reservation cancelled')).toBeVisible()
  await openInApp(page, url)
  await expect(page.getByRole('heading', { name: 'This reservation was cancelled' })).toBeVisible()
  await expect(page.getByText('Cancelled', { exact: true })).toBeVisible()
  await expect(page.getByText('Salamat!')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'What happens next' })).toHaveCount(0)
})

const bookUnpaid = async (page: import('@playwright/test').Page) => {
  await page.goto('/reserve')
  await page.getByLabel('Date').fill(`${new Date().getFullYear() + 1}-12-01`)
  await page.getByRole('button', { name: '7:00 PM' }).click()
  await page.getByRole('button', { name: 'Continue to Deposit' }).click()
  await expect(page).toHaveURL(/\/reserve\/payment\?code=RSV-/)
  return new URL(page.url()).searchParams.get('code')
}

test('coming back from paying says the payment is being confirmed', async ({ page }) => {
  await page.clock.install()
  const code = await bookUnpaid(page)
  await page.evaluate(`sessionStorage.setItem('paying:${code}', '1')`)
  await openInApp(page, `/reserve/confirmation/${code}`)
  await expect(page.getByRole('heading', { name: 'Confirming your payment…' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Pay Deposit' })).toHaveCount(0)
  await page.clock.fastForward(31000)
  await expect(page.getByRole('link', { name: 'Pay Deposit' })).toBeVisible()
  await expect(page.getByText(/Refresh this page before paying again/)).toBeVisible()
})

test('an unpaid deposit shows as due, with a way to pay', async ({ page }) => {
  const code = await bookUnpaid(page)
  await openInApp(page, `/reserve/confirmation/${code}`)
  await expect(
    page.getByRole('heading', { name: 'Pay your deposit to hold your table' }),
  ).toBeVisible()
  await expect(page.getByText('Salamat!')).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Pay Deposit' })).toHaveAttribute(
    'href',
    `/reserve/payment?code=${code}`,
  )
  await expect(page.getByText('Deposit Due')).toBeVisible()
  await expect(page.getByText('₱200.00')).toBeVisible()
  await expect(page.getByText('Deposit Paid')).toHaveCount(0)
})
