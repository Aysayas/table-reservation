import { expect, test, type Page } from '@playwright/test'

const fill = async (page: Page) => {
  await page.goto('/table/5?t=sample-qr-token-5')
  await page.getByRole('button', { name: 'Add Bulalo' }).click()
  await page.getByRole('button', { name: 'Add Nachos' }).click()
  await page.getByRole('button', { name: 'Add Nachos' }).click()
  await page.getByRole('link', { name: /View Cart/ }).click()
  await page.getByRole('link', { name: 'Proceed to Checkout' }).click()
}

test('checkout shows the summary, payment choices and name', async ({ page }) => {
  await fill(page)
  await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible()
  await expect(page.getByText('1x Bulalo')).toBeVisible()
  await expect(page.getByText('2x Nachos')).toBeVisible()
  await expect(page.getByText('₱750.00')).toBeVisible()
  await expect(page.getByRole('radio', { name: /Pay Now/ })).toBeChecked()
  await expect(page.getByRole('radio', { name: /Pay at the Counter/ })).toBeVisible()
  await expect(page.getByLabel('Name for the Order (optional)')).toHaveAttribute('maxlength', '60')
})

test('place order empties the cart and opens the order status', async ({ page }) => {
  await fill(page)
  await page.getByRole('radio', { name: /Pay at the Counter/ }).check()
  await page.getByLabel('Name for the Order (optional)').fill('Juan')
  await page.getByRole('button', { name: 'Place Order' }).click()
  await expect(page).toHaveURL(/\/table\/5\/orders\?order=\d+&pay=counter$/)
  await expect(page.getByText('Order placed')).toBeVisible()
  await expect(page.getByText('Salamat!')).toBeVisible()
  await expect(page.getByText("Unpaid · Pay at the counter when you're done")).toBeVisible()
  await expect(page.getByRole('link', { name: 'Cart, 0 items' })).toBeVisible()
})

test('without the table QR token the order cannot be placed', async ({ page }) => {
  await page.goto('/table/5/menu/2')
  await page.getByRole('button', { name: /Add to Cart/ }).click()
  await page.goto('/table/5/checkout')
  await expect(page.getByRole('alert')).toHaveText(
    'Please scan the QR code on your table again before ordering.',
  )
  await expect(page.getByRole('button', { name: 'Place Order' })).toBeDisabled()
})

test('an empty cart links back to the menu', async ({ page }) => {
  await page.goto('/table/5/checkout')
  await expect(page.getByText('Your cart is empty')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Browse the menu' })).toHaveAttribute(
    'href',
    '/table/5/menu',
  )
})
