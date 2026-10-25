import { expect, test } from '@playwright/test'

const url = '/table/5/menu/2'

test('item details shows the dish, quantity, notes and often ordered with', async ({ page }) => {
  await page.goto(url)
  await expect(
    page.getByRole('heading', { name: 'Tapa with Dilis and Banana Garlic Oleo' }),
  ).toBeVisible()
  await expect(page.getByText('₱250.00').first()).toBeVisible()
  await expect(page.getByRole('group', { name: 'Quantity' })).toBeVisible()
  await expect(page.getByLabel('Notes (optional)')).toHaveAttribute(
    'placeholder',
    'e.g. less spicy',
  )
  await expect(page.getByRole('heading', { name: 'Often Ordered With' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Add to Cart · ₱250.00' })).toBeVisible()
})

test('quantity changes the price on the button', async ({ page }) => {
  await page.goto(url)
  await expect(page.getByRole('button', { name: 'Less' })).toBeDisabled()
  await page.getByRole('button', { name: 'More' }).click()
  await page.getByRole('button', { name: 'More' }).click()
  await expect(page.getByRole('group', { name: 'Quantity' }).getByRole('status')).toHaveText('3')
  await expect(page.getByRole('button', { name: 'Add to Cart · ₱750.00' })).toBeVisible()
})

test('add to cart keeps the quantity and notes and opens the cart', async ({ page }) => {
  await page.goto(url)
  await page.getByRole('button', { name: 'More' }).click()
  await page.getByLabel('Notes (optional)').fill('Less salty')
  await page.getByRole('button', { name: /Add to Cart/ }).click()
  await expect(page).toHaveURL('/table/5/cart')
  const lines = await page.evaluate(() => JSON.parse(sessionStorage.getItem('cart') ?? '{}'))
  expect(lines.state.lines).toEqual([
    {
      item_id: 2,
      name: 'Tapa with Dilis and Banana Garlic Oleo',
      price: 250,
      quantity: 2,
      notes: 'Less salty',
    },
  ])
  await expect(page.getByRole('link', { name: 'Cart, 2 items' })).toBeVisible()
})

test('often ordered with adds one to the cart', async ({ page }) => {
  await page.goto(url)
  await page
    .getByRole('region', { name: 'Often Ordered With' })
    .getByRole('button', { name: /^Add / })
    .first()
    .click()
  await expect(page.getByRole('link', { name: 'Cart, 1 item' })).toBeVisible()
  await expect(page).toHaveURL(url)
})

test('an unknown dish shows not found with a way back', async ({ page }) => {
  await page.goto('/table/5/menu/9999')
  await expect(page.getByRole('heading', { name: 'Dish not found' })).toBeVisible()
  await page.getByRole('link', { name: 'Back to the menu' }).click()
  await expect(page).toHaveURL('/table/5/menu')
})
