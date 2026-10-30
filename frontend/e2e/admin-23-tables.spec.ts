import { expect, test } from '@playwright/test'

const url = '/admin/tables'

test.beforeEach(async ({ page }) => {
  await page.addInitScript('window.print = () => {}')
})

test('tables and QR codes shows a card per table with its order link', async ({ page }) => {
  await page.goto(url)
  await expect(page.getByRole('heading', { name: 'Tables and QR Codes', level: 1 })).toBeVisible()
  await expect(page.getByText('9 tables')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Print All QR' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Add Table' })).toBeVisible()
  await expect(page.getByRole('listitem', { name: /^Table T\d$/ })).toHaveCount(9)
  const t1 = page.getByRole('listitem', { name: 'Table T1' })
  await expect(t1).toContainText('2 seats')
  await expect(t1.getByRole('img', { name: /\/table\/1\?t=sample-qr-token-1$/ })).toBeVisible()
  for (const name of [
    'Download Table T1 QR',
    'Print Table T1 QR',
    'Edit Table T1',
    'Delete Table T1',
  ]) {
    await expect(t1.getByRole('button', { name })).toBeVisible()
  }
})

test('download saves the QR as a PNG', async ({ page }) => {
  await page.goto(url)
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download Table T1 QR' }).click()
  expect((await download).suggestedFilename()).toBe('table-T1-qr.png')
})

test('print shows only that table, and print all shows every table', async ({ page }) => {
  await page.goto(url)
  await page.getByRole('button', { name: 'Print Table T3 QR' }).click()
  await page.emulateMedia({ media: 'print' })
  const printed = page.getByRole('region', { name: /^Printed QR for Table/ })
  await expect(printed).toHaveCount(1)
  await expect(printed).toContainText('Table T3')
  await expect(printed).toContainText('Scan to order')
  await expect(page.getByRole('navigation', { name: 'Admin menu' })).toBeHidden()
  await page.emulateMedia({ media: 'screen' })
  await page.getByRole('button', { name: 'Print All QR' }).click()
  await page.emulateMedia({ media: 'print' })
  await expect(printed).toHaveCount(9)
})

test('adding a table makes a new card, and table numbers are unique', async ({ page }) => {
  await page.goto(url)
  await page.getByRole('button', { name: 'Add Table' }).click()
  const dialog = page.getByRole('dialog', { name: 'Add Table' })
  await dialog.getByRole('button', { name: 'Save Table' }).click()
  await expect(dialog.getByText('Enter a table number')).toBeVisible()
  await dialog.getByLabel('Table Number').fill('T10')
  await dialog.getByLabel('Seats').fill('6')
  await dialog.getByRole('button', { name: 'Save Table' }).click()
  await expect(page.getByText('Table T10 saved')).toBeVisible()
  const t10 = page.getByRole('listitem', { name: 'Table T10' })
  await expect(t10).toContainText('6 seats')
  await expect(t10.getByRole('img', { name: /\/table\/10\?t=[0-9a-f]{64}$/ })).toBeVisible()
  await expect(page.getByText('10 tables')).toBeVisible()

  await page.getByRole('button', { name: 'Add Table' }).click()
  await dialog.getByLabel('Table Number').fill('t1')
  await dialog.getByRole('button', { name: 'Save Table' }).click()
  await expect(page.getByText('A table with that number already exists')).toBeVisible()
})

test('editing changes the seats, but not below a booking', async ({ page }) => {
  await page.goto(url)
  await page.getByRole('button', { name: 'Edit Table T3' }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit Table T3' })
  await expect(dialog.getByLabel('Table Number')).toHaveValue('T3')
  await dialog.getByLabel('Seats').fill('3')
  await dialog.getByRole('button', { name: 'Save Table' }).click()
  await expect(page.getByRole('listitem', { name: 'Table T3' })).toContainText('3 seats')

  await page.getByRole('button', { name: 'Edit Table T5' }).click()
  await page.getByLabel('Seats').fill('2')
  await page.getByRole('button', { name: 'Save Table' }).click()
  await expect(
    page.getByText('A booking from today on has more guests than this table seats'),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Cancel' }).click()
  await expect(page.getByRole('listitem', { name: 'Table T5' })).toContainText('4 seats')
})

test('delete asks first and keeps a table with orders', async ({ page }) => {
  await page.goto(url)
  await page.getByRole('button', { name: 'Delete Table T2' }).click()
  await page
    .getByRole('dialog', { name: 'Delete Table T2?' })
    .getByRole('button', { name: 'Delete' })
    .click()
  await expect(
    page.getByText("This table has orders or upcoming bookings. It can't be deleted."),
  ).toBeVisible()
  await expect(page.getByRole('listitem', { name: 'Table T2' })).toBeVisible()

  await page.getByRole('button', { name: 'Add Table' }).click()
  await page.getByLabel('Table Number').fill('T10')
  await page.getByRole('button', { name: 'Save Table' }).click()
  await page.getByRole('button', { name: 'Delete Table T10' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click()
  await expect(page.getByRole('listitem', { name: 'Table T10' })).toBeVisible()
  await page.getByRole('button', { name: 'Delete Table T10' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByText('Table T10 deleted')).toBeVisible()
  await expect(page.getByRole('listitem', { name: 'Table T10' })).toHaveCount(0)
})
