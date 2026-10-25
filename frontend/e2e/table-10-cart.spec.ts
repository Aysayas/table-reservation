import { expect, test, type Page } from '@playwright/test'

const fill = async (page: Page) => {
  await page.goto('/table/5/menu/2')
  await page.getByRole('button', { name: 'More' }).click()
  await page.getByLabel('Notes (optional)').fill('less salty')
  await page.getByRole('button', { name: /Add to Cart/ }).click()
  await page.goto('/table/5?t=sample-qr-token-5')
  await page.getByRole('button', { name: 'Add Bulalo' }).click()
  await page.goto('/table/5/cart')
}

test('an empty cart links back to the menu', async ({ page }) => {
  await page.goto('/table/5/cart')
  await expect(page.getByRole('heading', { name: 'Your Cart' })).toBeVisible()
  await expect(page.getByText('Your cart is empty')).toBeVisible()
  await page.getByRole('link', { name: 'Browse the menu' }).click()
  await expect(page).toHaveURL('/table/5/menu')
})

test('the cart shows each line with its note, the totals and checkout', async ({ page }) => {
  await fill(page)
  await expect(page.getByText('Tapa with Dilis and Banana Garlic Oleo')).toBeVisible()
  await expect(page.getByText('Note: less salty')).toBeVisible()
  await expect(page.getByText('₱500.00')).toBeVisible()
  await expect(page.getByText('Bulalo', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'You Might Also Like' })).toBeVisible()
  await expect(page.getByText('Subtotal')).toBeVisible()
  await expect(page.getByText(/Service Charge/)).toBeVisible()
  await expect(page.getByText('₱950.00')).toHaveCount(2)
  await page.getByRole('link', { name: 'Proceed to Checkout' }).click()
  await expect(page).toHaveURL('/table/5/checkout')
})

test('quantity buttons and remove update the totals', async ({ page }) => {
  await fill(page)
  await page.getByRole('button', { name: 'More Bulalo' }).click()
  await expect(page.getByText('₱900.00')).toBeVisible()
  await expect(page.getByText('₱1,400.00')).toHaveCount(2)
  await page.getByRole('button', { name: 'Less Tapa with Dilis and Banana Garlic Oleo' }).click()
  await expect(page.getByText('₱1,150.00')).toHaveCount(2)
  await page.getByRole('button', { name: 'Remove Bulalo' }).click()
  await expect(page.getByText('Bulalo', { exact: true })).toHaveCount(0)
  await expect(page.getByText('₱250.00')).toHaveCount(3)
  await expect(page.getByRole('link', { name: 'Cart, 1 item' })).toBeVisible()
})

test('you might also like adds a dish', async ({ page }) => {
  await fill(page)
  await page
    .getByRole('region', { name: 'You Might Also Like' })
    .getByRole('button', { name: /^Add / })
    .first()
    .click()
  await expect(page.getByRole('link', { name: 'Cart, 4 items' })).toBeVisible()
})
