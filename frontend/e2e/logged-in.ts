import type { Page } from '@playwright/test'

export const logIn = (page: Page) =>
  page.addInitScript(() => {
    sessionStorage.setItem('sample-account', '100')
  })
