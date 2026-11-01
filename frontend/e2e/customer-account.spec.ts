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

  await page.getByRole('button', { name: /^Account menu/ }).click()
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
  await page.getByLabel('Confirm Password').fill('password123')
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
  await page.getByLabel('Confirm Password').fill('password123')
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
  await page.getByLabel('Confirm New Password').fill('newpassword1')
  await page.getByRole('button', { name: 'Save New Password' }).click()
  await expect(page).toHaveURL('/login')
})

test('reset password explains a bad or missing link', async ({ page }) => {
  await page.goto('/reset-password')
  await expect(page.getByText('This reset link is invalid or has expired.')).toBeVisible()
  await page.goto('/reset-password?token=expired')
  await page.getByLabel('New Password', { exact: true }).fill('newpassword1')
  await page.getByLabel('Confirm New Password').fill('newpassword1')
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
  const booking = page.getByRole('listitem', { name: 'Reservation RSV-000001' })
  await booking.getByRole('button', { name: 'Cancel RSV-000001' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel Reservation' }).click()
  await expect(booking.getByText('Cancelled', { exact: true })).toBeVisible()
  await expect(booking.getByRole('button', { name: 'Reschedule RSV-000001' })).toHaveCount(0)
})

test('the header shows who is logged in, with the account links in one menu', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: /^Account menu/ })).toHaveCount(0)
  await page.getByRole('button', { name: 'Open menu' }).click()
  await expect(page.getByRole('link', { name: 'Log In' })).toBeVisible()
  await logIn(page)
  const account = page.getByRole('button', {
    name: 'Account menu, logged in as Customer Name',
  })
  await expect(account).toBeVisible()
  await page.getByRole('button', { name: 'Open menu' }).click()
  await expect(page.locator('header').getByRole('link', { name: 'Log In' })).toHaveCount(0)
  await expect(
    page.locator('header').getByRole('link', { name: 'Find My Reservation' }),
  ).toHaveCount(0)
  await account.click()
  await expect(page.getByText('Logged in as')).toBeVisible()
  await expect(page.getByRole('link', { name: 'My Reservations' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Profile' })).toBeVisible()
  await page.getByRole('button', { name: 'Log Out' }).click()
  await expect(page).toHaveURL('/')
  await expect(page.getByText("You're logged out")).toBeVisible()
  await expect(account).toHaveCount(0)
})

test('the account menu also works at desktop width and closes on escape', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => sessionStorage.setItem('sample-account', '100'))
  await page.goto('/')
  await expect(page.locator('header').getByText('Customer', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: /^Account menu/ }).click()
  await expect(page.getByRole('link', { name: 'Profile' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('link', { name: 'Profile' })).toHaveCount(0)
})

test('a logged-in guest at a table can still see they are logged in', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('sample-account', '100'))
  await page.goto('/table/1/menu')
  await expect(page.getByRole('button', { name: /^Account menu/ })).toBeVisible()
})

test('passwords must match when signing up and resetting', async ({ page }) => {
  await page.goto('/register')
  await page.getByLabel('Full Name').fill('Juan Dela Cruz')
  await page.getByLabel('Mobile Number').fill('9171234567')
  await page.getByLabel('Email').fill('juan@placeholder-domain.com')
  await page.getByLabel('Password', { exact: true }).fill('password123')
  await page.getByLabel('Confirm Password').fill('password124')
  await page.getByRole('button', { name: 'Create Account' }).click()
  await expect(page.getByText("Passwords don't match")).toBeVisible()
  await expect(page).toHaveURL('/register')

  await page.goto('/reset-password?token=abc')
  await page.getByLabel('New Password', { exact: true }).fill('newpassword1')
  await page.getByLabel('Confirm New Password').fill('different1')
  await page.getByRole('button', { name: 'Save New Password' }).click()
  await expect(page.getByText("Passwords don't match")).toBeVisible()
})

test('forgetting a password keeps the page the guest was going to', async ({ page }) => {
  await page.goto('/login?next=%2Freserve%3Fdate%3D2030-12-01')
  await page.getByRole('link', { name: 'Forgot password?' }).click()
  await expect(page).toHaveURL('/forgot-password?next=%2Freserve%3Fdate%3D2030-12-01')
  await page.getByLabel('Email').fill('customer@placeholder-domain.com')
  await page.getByRole('button', { name: 'Send Reset Link' }).click()
  await expect(page.getByText(/^If that email has an account/)).toBeVisible()
  await page.goto('/reset-password?token=abc')
  await page.getByLabel('New Password', { exact: true }).fill('newpassword1')
  await page.getByLabel('Confirm New Password').fill('newpassword1')
  await page.getByRole('button', { name: 'Save New Password' }).click()
  await expect(page).toHaveURL('/login?next=%2Freserve%3Fdate%3D2030-12-01')
})

test('profile needs a login', async ({ page }) => {
  await page.goto('/profile')
  await expect(page).toHaveURL('/login?next=%2Fprofile')
})

test('profile saves a name without a password', async ({ page }) => {
  await logIn(page)
  await page.getByRole('button', { name: /^Account menu/ }).click()
  await page.getByRole('link', { name: 'Profile' }).click()
  await expect(page.getByLabel('Mobile Number')).toHaveValue('9000000000')
  await expect(page.getByLabel('Current Password')).toHaveCount(0)
  await page.getByLabel('Full Name').fill('Juan Dela Cruz')
  await page.getByRole('button', { name: 'Save Changes' }).click()
  await expect(page.getByText('Your details were saved')).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Account menu, logged in as Juan Dela Cruz' }),
  ).toBeVisible()
})

test('profile asks for the password to change the mobile or email', async ({ page }) => {
  await logIn(page)
  await page.getByRole('button', { name: /^Account menu/ }).click()
  await page.getByRole('link', { name: 'Profile' }).click()
  await page.getByLabel('Mobile Number').fill('9171234567')
  await page.getByRole('button', { name: 'Save Changes' }).click()
  await expect(page.getByText('Enter your current password')).toBeVisible()
  await page.getByLabel('Current Password').fill('wrongpassword')
  await page.getByRole('button', { name: 'Save Changes' }).click()
  await expect(page.getByText('Your current password is wrong.')).toBeVisible()
  await page.getByLabel('Current Password').fill('password123')
  await page.getByRole('button', { name: 'Save Changes' }).click()
  await expect(page.getByText('Your details were saved')).toBeVisible()
  await expect(page.getByLabel('Current Password')).toHaveCount(0)
})

test('reserving needs a login and comes back with what was picked', async ({ page }) => {
  await page.goto('/reserve?date=2030-12-01&pax=4')
  await expect(page).toHaveURL(/^.*\/login\?next=/)
  await page.getByLabel('Mobile Number').fill('9000000000')
  await page.getByLabel('Password', { exact: true }).fill('password123')
  await page.getByRole('button', { name: 'Log In' }).click()
  await expect(page).toHaveURL('/reserve?date=2030-12-01&pax=4')
  await expect(page.getByLabel('Date')).toHaveValue('2030-12-01')
  await expect(page.getByText(/^Booking as Customer Name/)).toBeVisible()
})

test('a new booking shows up in my reservations', async ({ page }) => {
  await logIn(page)
  await page.goto('/reserve?date=2030-12-01')
  await page.getByRole('button', { name: '7:00 PM' }).click()
  await page.getByRole('button', { name: 'Continue to Deposit' }).click()
  await expect(page).toHaveURL(/\/reserve\/payment\?code=RSV-/)
  const code = new URL(page.url()).searchParams.get('code')
  await page.getByRole('button', { name: /^Account menu/ }).click()
  await page.getByRole('link', { name: 'My Reservations' }).click()
  await expect(page.getByRole('listitem', { name: `Reservation ${code}` })).toBeVisible()
})

test('rescheduling by link and finding a booking need no login', async ({ page }) => {
  await page.goto('/reserve?reschedule=RSV-000001')
  await expect(page.getByRole('button', { name: 'Confirm New Time' })).toBeVisible()
  await page.goto('/reservation')
  await expect(page.getByLabel('Reference Code')).toBeVisible()
})

test('table ordering does not show account links', async ({ page }) => {
  await page.goto('/table/1/menu')
  await page.getByRole('button', { name: 'Open menu' }).click()
  await expect(page.getByRole('link', { name: 'Log In' })).toHaveCount(0)
})

test('cancelling a paid booking says the deposit is non-refundable', async ({ page }) => {
  await logIn(page)
  await page.goto('/reserve?date=2030-12-01')
  await page.getByRole('button', { name: '7:00 PM' }).click()
  await page.getByRole('button', { name: 'Continue to Deposit' }).click()
  await page.getByRole('button', { name: 'Pay ₱200.00' }).click()
  await expect(page).toHaveURL(/\/reserve\/confirmation\/RSV-/)
  const code = page.url().split('/').pop()
  await page.getByRole('link', { name: 'Manage Reservation' }).click()
  await page.getByRole('button', { name: `Cancel ${code}` }).click()
  await expect(page.getByRole('dialog')).toContainText('Your ₱200.00 deposit is non-refundable.')
})
