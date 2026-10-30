import { expect, test } from '@playwright/test'

const url = '/admin/settings'
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

test('settings shows the restaurant information and opening hours', async ({ page }) => {
  await page.goto(url)
  await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Restaurant Information' })).toBeVisible()
  await expect(page.getByLabel('Restaurant Name')).toHaveValue("Vencio's Garden")
  await expect(page.getByLabel('Address')).toHaveValue(/Calapan City/)
  await expect(page.getByLabel('Contact Number')).toHaveValue('9189572855')
  await expect(page.getByText('+63')).toBeVisible()
  await expect(page.getByLabel('Email')).toHaveValue('venciosgarden@yahoo.com')
  await expect(page.getByLabel('Facebook Page')).toHaveValue(/facebook\.com/)
  await expect(page.getByRole('img', { name: 'Logo preview' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Upload Logo' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Save Changes' })).toBeVisible()

  await expect(page.getByRole('heading', { name: 'Opening Hours' })).toBeVisible()
  for (const day of days) {
    await expect(page.getByLabel(`${day} opens`)).toHaveValue('10:00')
    await expect(page.getByLabel(`${day} closes`)).toHaveValue('22:00')
    await expect(page.getByRole('switch', { name: `${day} open` })).toHaveAttribute(
      'aria-checked',
      'true',
    )
  }
  await expect(page.getByText('Toggle off to mark a day as closed.')).toBeVisible()
})

test('settings shows what to fix before saving', async ({ page }) => {
  await page.goto(url)
  await expect(page.getByLabel('Restaurant Name')).toHaveValue("Vencio's Garden")
  await page.getByLabel('Restaurant Name').fill('')
  await page.getByLabel('Contact Number').fill('123')
  await page.getByLabel('Email').fill('not-an-email')
  await page.getByLabel('Monday closes').fill('09:00')
  await page.getByRole('button', { name: 'Save Changes' }).click()
  await expect(page.getByText('Enter the restaurant name')).toBeVisible()
  await expect(page.getByText('Check your mobile number')).toBeVisible()
  await expect(page.getByText('Enter a valid email')).toBeVisible()
  await expect(page.getByText('Closing time must be after opening time')).toBeVisible()
})

test('save changes keeps the new details and closed day', async ({ page }) => {
  await page.goto(url)
  await expect(page.getByLabel('Restaurant Name')).toHaveValue("Vencio's Garden")
  await page.getByLabel('Restaurant Name').fill("Vencio's Garden Hotel")
  await page.getByLabel('Contact Number').fill('09171234567')
  await page.getByLabel('Saturday closes').fill('23:00')
  await page.getByRole('switch', { name: 'Sunday open' }).click()
  await page.getByRole('button', { name: 'Save Changes' }).click()
  await expect(page.getByText('Settings saved')).toBeVisible()

  await page.getByRole('link', { name: 'Staff Accounts' }).click()
  await page.getByRole('link', { name: 'Settings' }).click()
  await expect(page.getByLabel('Restaurant Name')).toHaveValue("Vencio's Garden Hotel")
  await expect(page.getByLabel('Contact Number')).toHaveValue('9171234567')
  await expect(page.getByLabel('Saturday closes')).toHaveValue('23:00')
  await expect(page.getByRole('switch', { name: 'Sunday open' })).toHaveAttribute(
    'aria-checked',
    'false',
  )
})

test('upload logo previews the file until it is saved', async ({ page }) => {
  await page.goto(url)
  await page.getByLabel('Logo file').setInputFiles({
    name: 'new-logo.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      'base64',
    ),
  })
  await expect(page.getByText('new-logo.png, saved when you click Save Changes')).toBeVisible()
  await expect(page.getByRole('img', { name: 'Logo preview' })).toHaveAttribute('src', /^blob:/)
  await page.getByRole('button', { name: 'Save Changes' }).click()
  await expect(page.getByText('Settings saved')).toBeVisible()
  await expect(page.getByText('PNG or JPG, up to 2 MB')).toBeVisible()
})
