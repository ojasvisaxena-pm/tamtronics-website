import { defineConfig } from '@playwright/test'

/**
 * Runs against the production build (BASE_URL) and the untouched original HTML site (ORIGINAL_URL).
 * Start both first; see docs/QA-REPORT.md for the exact commands.
 */
export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  workers: 2,
  fullyParallel: false,
  reporter: [['list'], ['json', { outputFile: 'test-results/results.json' }]],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3100',
    browserName: 'chromium',
    trace: 'retain-on-failure',
  },
})
