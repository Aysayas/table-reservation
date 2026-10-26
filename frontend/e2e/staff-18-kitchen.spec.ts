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
})
