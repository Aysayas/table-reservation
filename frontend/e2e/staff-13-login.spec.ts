import { expect, test } from '@playwright/test'

test('login page shows its parts', async ({ page }) => {
  await page.goto('/staff/login')
  await expect(page.getByRole('heading', { name: 'Staff Login' })).toBeVisible()
  await expect(page.getByText('Sign in to continue')).toBeVisible()
  await expect(page.getByLabel('Email')).toBeVisible()
  await expect(page.getByLabel('Password')).toBeVisible()
  await expect(page.getByLabel('Remember me')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Forgot password?' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Log In' })).toBeVisible()
})

test('empty form shows errors', async ({ page }) => {
  await page.goto('/staff/login')
  await page.getByRole('button', { name: 'Log In' }).click()
  await expect(page.getByText('Enter a valid email')).toBeVisible()
  await expect(page.getByText('Enter your password')).toBeVisible()
  await expect(page).toHaveURL('/staff/login')
})

test('valid login goes to the staff dashboard', async ({ page }) => {
  await page.goto('/staff/login')
  await page.getByLabel('Email').fill('juan@placeholder-domain.com')
  await page.getByLabel('Password').fill('password123')
  await page.getByRole('button', { name: 'Log In' }).click()
  await expect(page).toHaveURL('/staff')
})

test('forgot password shows a message', async ({ page }) => {
  await page.goto('/staff/login')
  await page.getByRole('button', { name: 'Forgot password?' }).click()
  await expect(page.getByText('Ask an admin to reset your password.')).toBeVisible()
})
