import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'mobile',
      testMatch: ['**/customer*.spec.ts', '**/table*.spec.ts'],
      use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } },
    },
    {
      name: 'desktop',
      testIgnore: ['**/customer*.spec.ts', '**/table*.spec.ts', '**/devices.spec.ts'],
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'iphone',
      testMatch: '**/devices.spec.ts',
      use: { ...devices['iPhone 13'], viewport: { width: 390, height: 844 } },
    },
    {
      name: 'android',
      testMatch: '**/devices.spec.ts',
      use: { ...devices['Pixel 7'], viewport: { width: 412, height: 915 } },
    },
  ],
  webServer: {
    command: 'npm run dev -- --port 5174 --strictPort',
    url: 'http://localhost:5174',
    reuseExistingServer: false,
    env: { VITE_USE_SAMPLE: 'true' },
  },
})
