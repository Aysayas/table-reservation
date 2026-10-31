import { expect, test, type Page } from '@playwright/test'

const logIn = async (page: Page) => {
  await page.goto('/login')
  await page.getByLabel('Mobile Number').fill('9000000000')
  await page.getByLabel('Password', { exact: true }).fill('password123')
  await page.getByRole('button', { name: 'Log In' }).click()
  await expect(page).toHaveURL('/my-reservations')
}

test('log in shows errors for an empty form', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('button', { name: 'Log In' }).click()
  await expect(page.getByText('Check your mobile number')).toBeVisible()
  await expect(page.getByText('Enter your password')).toBeVisible()
})

test('a wrong password stays on the page with a message', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Mobile Number').fill('9000000000')
  await page.getByLabel('Password', { exact: true }).fill('wrongpassword')
  await page.getByRole('button', { name: 'Log In' }).click()
  await expect(page.getByText('Invalid mobile number or password')).toBeVisible()
  await expect(page).toHaveURL('/login')
})

test('the password can be shown', async ({ page }) => {
  await page.goto('/login')
  const password = page.getByLabel('Password', { exact: true })
  await expect(password).toHaveAttribute('type', 'password')
  await page.getByRole('button', { name: 'Show password' }).click()
  await expect(password).toHaveAttribute('type', 'text')
})

test('logging in returns to the page in next, but never to another site', async ({ page }) => {
  await page.goto('/login?next=%2Fmenu')
  await page.getByLabel('Mobile Number').fill('9000000000')
  await page.getByLabel('Password', { exact: true }).fill('password123')
  await page.getByRole('button', { name: 'Log In' }).click()
  await expect(page).toHaveURL('/menu')

  await page.getByRole('button', { name: 'Open menu' }).click()
  await page.getByRole('button', { name: 'Log Out' }).click()
  await page.goto('/login?next=%2F%2Fexample.com')
  await page.getByLabel('Mobile Number').fill('9000000000')
  await page.getByLabel('Password', { exact: true }).fill('password123')
  await page.getByRole('button', { name: 'Log In' }).click()
  await expect(page).toHaveURL('/my-reservations')
})

test('register checks its fields, then logs the guest in', async ({ page }) => {
  await page.goto('/register')
  await page.getByRole('button', { name: 'Create Account' }).click()
  await expect(page.getByText('Enter your full name')).toBeVisible()
  await expect(page.getByText('Enter a valid email')).toBeVisible()
  await expect(page.getByText('Use at least 8 characters')).toBeVisible()

  await page.getByLabel('Full Name').fill('Juan Dela Cruz')
  await page.getByLabel('Mobile Number').fill('9171234567')
  await page.getByLabel('Email').fill('juan@placeholder-domain.com')
  await page.getByLabel('Password', { exact: true }).fill('password123')
  await page.getByRole('button', { name: 'Create Account' }).click()
  await expect(page).toHaveURL('/my-reservations')
  await expect(page.getByText('Hi, Juan Dela Cruz.')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'No reservations yet' })).toBeVisible()
})

test('register refuses a mobile number already in use', async ({ page }) => {
  await page.goto('/register')
  await page.getByLabel('Full Name').fill('Juan Dela Cruz')
  await page.getByLabel('Mobile Number').fill('9000000000')
  await page.getByLabel('Email').fill('new@placeholder-domain.com')
  await page.getByLabel('Password', { exact: true }).fill('password123')
  await page.getByRole('button', { name: 'Create Account' }).click()
  await expect(page.getByText('An account with that mobile number already exists.')).toBeVisible()
})

test('forgot password confirms without saying if the account exists', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('link', { name: 'Forgot password?' }).click()
  await expect(page).toHaveURL('/forgot-password')
  await page.getByRole('button', { name: 'Send Reset Link' }).click()
  await expect(page.getByText('Enter a valid email')).toBeVisible()
  await page.getByLabel('Email').fill('nobody@placeholder-domain.com')
  await page.getByRole('button', { name: 'Send Reset Link' }).click()
  await expect(page.getByText(/^If that email has an account/)).toBeVisible()
})

test('reset password saves and goes to log in', async ({ page }) => {
  await page.goto('/reset-password?token=abc')
  await page.getByRole('button', { name: 'Save New Password' }).click()
  await expect(page.getByText('Use at least 8 characters')).toBeVisible()
  await page.getByLabel('New Password', { exact: true }).fill('newpassword1')
  await page.getByRole('button', { name: 'Save New Password' }).click()
  await expect(page).toHaveURL('/login')
})

test('reset password explains a bad or missing link', async ({ page }) => {
  await page.goto('/reset-password')
  await expect(page.getByText('This reset link is invalid or has expired.')).toBeVisible()
  await page.goto('/reset-password?token=expired')
  await page.getByLabel('New Password', { exact: true }).fill('newpassword1')
  await page.getByRole('button', { name: 'Save New Password' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'invalid or has expired' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Send a new link' })).toBeVisible()
})

test('my reservations needs a login', async ({ page }) => {
  await page.goto('/my-reservations')
  await expect(page).toHaveURL('/login?next=%2Fmy-reservations')
})

test('my reservations lists bookings with their actions', async ({ page }) => {
  await logIn(page)
  const booking = page.getByRole('listitem', { name: 'Reservation RSV-000001' })
  await expect(booking).toBeVisible()
  await expect(booking.getByRole('button', { name: 'Reschedule RSV-000001' })).toBeVisible()
  await booking.getByRole('button', { name: 'Reschedule RSV-000001' }).click()
  await expect(page).toHaveURL('/reserve?reschedule=RSV-000001')
  await expect(page.getByLabel('Mobile Number')).toHaveValue('9000000000')
})

test('cancelling asks first and updates the booking', async ({ page }) => {
  await logIn(page)
  page.on('dialog', (dialog) => dialog.accept())
  const booking = page.getByRole('listitem', { name: 'Reservation RSV-000001' })
  await booking.getByRole('button', { name: 'Cancel RSV-000001' }).click()
  await expect(booking.getByText('Cancelled', { exact: true })).toBeVisible()
  await expect(booking.getByRole('button', { name: 'Reschedule RSV-000001' })).toHaveCount(0)
})

test('the menu shows log in, then my reservations and log out', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Open menu' }).click()
  await expect(page.getByRole('link', { name: 'Log In' })).toBeVisible()
  await logIn(page)
  await page.getByRole('button', { name: 'Open menu' }).click()
  await expect(page.getByRole('link', { name: 'My Reservations' }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Log Out' }).click()
  await expect(page).toHaveURL('/')
  await page.getByRole('button', { name: 'Open menu' }).click()
  await expect(page.getByRole('link', { name: 'Log In' })).toBeVisible()
})

test('table ordering does not show account links', async ({ page }) => {
  await page.goto('/table/1/menu')
  await page.getByRole('button', { name: 'Open menu' }).click()
  await expect(page.getByRole('link', { name: 'Log In' })).toHaveCount(0)
})
