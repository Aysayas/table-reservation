import { expect, test } from '@playwright/test'

const url = '/kitchen'

test('kitchen display shows the three columns with their orders', async ({ page }) => {
  await page.goto(url)
  await expect(page.getByRole('heading', { name: 'Kitchen Display' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Log Out' })).toHaveAttribute('href', '/staff/login')
  for (const name of ['Received (1)', 'Preparing (1)', 'Ready (1)']) {
    await expect(page.getByRole('heading', { name })).toBeVisible()
  }
  const preparing = page.getByRole('region', { name: 'Preparing (1)' })
  const order = preparing.getByRole('listitem', { name: 'Order #1' })
  await expect(order).toContainText('Table T2')
  await expect(order).toContainText('Hungarian Sausage with Bread and Egg')
  await expect(order).toContainText('No onions')
  await expect(order.getByRole('button', { name: 'Mark Ready' })).toBeVisible()
  await expect(page.getByRole('listitem', { name: 'Order #2' })).toHaveCount(0)
})

test('each button moves the order one step until it is served', async ({ page }) => {
  await page.goto(url)
  await page.getByRole('button', { name: 'Start Preparing' }).click()
  await expect(page.getByText('Order #3 is now preparing')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Received (0)' })).toBeVisible()
  const preparing = page.getByRole('region', { name: 'Preparing (2)' })
  await expect(preparing.getByRole('listitem', { name: 'Order #3' })).toBeVisible()
  await expect(page.getByText('No orders here. New orders appear automatically.')).toBeVisible()

  await preparing
    .getByRole('listitem', { name: 'Order #3' })
    .getByRole('button', { name: 'Mark Ready' })
    .click()
  const ready = page.getByRole('region', { name: 'Ready (2)' })
  await expect(ready.getByRole('listitem', { name: 'Order #3' })).toBeVisible()

  await ready
    .getByRole('listitem', { name: 'Order #3' })
    .getByRole('button', { name: 'Mark Served' })
    .click()
  await expect(page.getByText('Order #3 is now served')).toBeVisible()
  await expect(page.getByRole('listitem', { name: 'Order #3' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(ready.getByRole('listitem', { name: 'Order #3' })).toBeVisible()
})

test('staff reach the kitchen from the sidebar and can go back', async ({ page }) => {
  await page.goto('/staff/orders')
  await page.getByRole('link', { name: 'Kitchen', exact: true }).click()
  await expect(page).toHaveURL(url)
  await page.getByRole('link', { name: 'Back' }).click()
  await expect(page).toHaveURL('/staff/orders')
})

test('log out goes to the staff login', async ({ page }) => {
  await page.goto(url)
  await page.getByRole('link', { name: 'Log Out' }).click()
  await expect(page).toHaveURL('/staff/login')
})

test('the header counts open orders and offers full screen', async ({ page }) => {
  await page.goto(url)
  await expect(page.getByRole('banner').getByText(/^3 open/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Full screen' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sound' })).toHaveAttribute('aria-pressed', 'false')
})

test('bumping one ticket leaves the others ready to bump', async ({ page }) => {
  await page.goto(url)
  await page.getByRole('button', { name: 'Start Preparing' }).click()
  const preparing = page.getByRole('region', { name: 'Preparing (2)' })
  for (const id of ['Order #1', 'Order #3']) {
    await expect(
      preparing.getByRole('listitem', { name: id }).getByRole('button', { name: 'Mark Ready' }),
    ).toBeEnabled()
  }
  await expect(page.getByRole('button', { name: 'Mark Served' })).toBeEnabled()
})

test('cooks can tick items off, and the ticks survive a reload', async ({ page }) => {
  await page.goto(url)
  const item = page
    .getByRole('listitem', { name: 'Order #1' })
    .getByRole('button', { name: /Hungarian Sausage/ })
  await expect(item).toHaveAttribute('aria-pressed', 'false')
  await item.click()
  await expect(item).toHaveAttribute('aria-pressed', 'true')
  await page.reload()
  await expect(item).toHaveAttribute('aria-pressed', 'true')
})
