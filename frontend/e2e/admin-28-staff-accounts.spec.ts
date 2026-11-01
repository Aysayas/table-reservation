import { expect, test } from '@playwright/test'

const url = '/admin/users'

test('staff accounts shows the toolbar and every account', async ({ page }) => {
  await page.goto(url)
  await expect(page.getByRole('heading', { name: 'Staff Accounts', level: 1 })).toBeVisible()
  await expect(page.getByRole('searchbox', { name: 'Search' })).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Role' })).toHaveValue('')
  await expect(page.getByRole('button', { name: 'Add Staff' })).toBeVisible()
  for (const h of ['Name', 'Email', 'Role', 'Status', 'Last Login', 'Actions']) {
    await expect(page.getByRole('columnheader', { name: h })).toBeVisible()
  }
  await expect(page.getByRole('row')).toHaveCount(5)
  const disabled = page.getByRole('row').filter({ hasText: 'staff2@placeholder-domain.com' })
  await expect(disabled.getByText('Disabled')).toBeVisible()
  await expect(disabled.getByRole('button', { name: /^Enable/ })).toBeVisible()
})

test('search and the role filter narrow the list', async ({ page }) => {
  await page.goto(url)
  await page.getByRole('searchbox', { name: 'Search' }).fill('kitchen')
  await expect(page.getByRole('row')).toHaveCount(2)
  await expect(
    page.getByRole('cell', { name: 'kitchen@placeholder-domain.com', exact: true }),
  ).toBeVisible()
  await page.getByRole('searchbox', { name: 'Search' }).fill('')
  await page.getByRole('combobox', { name: 'Role' }).selectOption('staff')
  await expect(page.getByRole('row')).toHaveCount(3)
  await page.getByRole('searchbox', { name: 'Search' }).fill('nobody')
  await expect(page.getByText('No staff accounts match.')).toBeVisible()
})

test('add staff checks the fields and adds the new account', async ({ page }) => {
  await page.goto(url)
  await page.getByRole('button', { name: 'Add Staff' }).click()
  const dialog = page.getByRole('dialog', { name: 'Add Staff' })
  await dialog.getByRole('button', { name: 'Save Staff' }).click()
  await expect(dialog.getByText('Enter a full name')).toBeVisible()
  await expect(dialog.getByText('Enter a valid email')).toBeVisible()
  await expect(dialog.getByText('Use at least 8 characters')).toBeVisible()

  await dialog.getByLabel('Full Name').fill('Juan Dela Cruz')
  await dialog.getByLabel('Email').fill('staff@placeholder-domain.com')
  await dialog.getByLabel('Role').selectOption('kitchen')
  await dialog.getByLabel('Password').fill('password123')
  await dialog.getByRole('button', { name: 'Save Staff' }).click()
  await expect(page.getByText('That email is already used by another account')).toBeVisible()

  await dialog.getByLabel('Email').fill('juan@placeholder-domain.com')
  await dialog.getByRole('button', { name: 'Save Staff' }).click()
  await expect(dialog).toBeHidden()
  const row = page.getByRole('row').filter({ hasText: 'juan@placeholder-domain.com' })
  await expect(row).toContainText('Juan Dela Cruz')
  await expect(row).toContainText('Kitchen')
  await expect(row).toContainText('Active')
  await expect(row).toContainText('Never')
})

test('edit fills the form and your own account cannot be disabled', async ({ page }) => {
  await page.goto(url)
  const me = page.getByRole('row').filter({ hasText: 'admin@placeholder-domain.com' })
  await expect(me.getByRole('button', { name: /^Disable/ })).toHaveCount(0)
  await me.getByRole('button', { name: 'Edit admin@placeholder-domain.com' }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit Staff' })
  await expect(dialog.getByLabel('Full Name')).toHaveValue('Admin Name')
  await expect(dialog.getByLabel('Role')).toHaveValue('Admin')
  await expect(dialog.getByText("You can't change your own role.")).toBeVisible()
  await dialog.getByRole('button', { name: 'Cancel' }).click()

  await page.getByRole('button', { name: 'Edit kitchen@placeholder-domain.com' }).click()
  await dialog.getByRole('heading').waitFor()
  await page.getByLabel('Full Name').fill('Kitchen Lead')
  await page.getByRole('button', { name: 'Save Staff' }).click()
  await expect(page.getByRole('cell', { name: 'Kitchen Lead' })).toBeVisible()
})

test('disable and enable switch the account status', async ({ page }) => {
  await page.goto(url)
  const row = page.getByRole('row').filter({ hasText: 'staff@placeholder-domain.com' })
  await row.getByRole('button', { name: 'Disable staff@placeholder-domain.com' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click()
  await expect(row.getByText('Active')).toBeVisible()
  await row.getByRole('button', { name: 'Disable staff@placeholder-domain.com' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Disable' }).click()
  await expect(row.getByText('Disabled')).toBeVisible()
  await row.getByRole('button', { name: 'Enable staff@placeholder-domain.com' }).click()
  await expect(row.getByText('Active')).toBeVisible()
})
