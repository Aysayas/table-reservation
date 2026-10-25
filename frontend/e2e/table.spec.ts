import { expect, test } from '@playwright/test'

test('scanning a table QR opens the table menu', async ({ page }) => {
  await page.goto('/table/1')
  await expect(page.getByRole('heading', { name: 'Table T1 menu' })).toBeAttached()
})
