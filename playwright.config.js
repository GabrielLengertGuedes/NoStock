import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(globalThis.process.env.CI),
  retries: globalThis.process.env.CI ? 1 : 0,
  timeout: 30_000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4175', locale: 'pt-BR', timezoneId: 'America/Sao_Paulo',
    serviceWorkers: 'block', screenshot: 'only-on-failure', trace: 'on-first-retry',
  },
  projects: [
    { name: 'desktop', testIgnore: '**/movel.spec.js', use: { browserName: 'chromium', viewport: { width: 1440, height: 1000 } } },
    { name: 'celular', testMatch: '**/movel.spec.js', use: { browserName: 'chromium', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  webServer: [
    { command: 'node scripts/e2e/start-api.js', url: 'http://127.0.0.1:3002/api/health', reuseExistingServer: false },
    { command: 'node node_modules/vite/bin/vite.js preview --config vite.e2e.config.js', url: 'http://127.0.0.1:4175', reuseExistingServer: false },
  ],
})
