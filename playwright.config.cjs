const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright Configuration for CRM E2E Tests
 *
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests/e2e',

  // Maximum time one test can run
  timeout: 60 * 1000,

  // Test execution settings
  fullyParallel: false, // Run tests sequentially to avoid conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker to prevent race conditions

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],

  // Shared settings for all projects
  use: {
    // Base URL for the application
    baseURL: process.env.PLAYWRIGHT_BASE_URL || process.env.BASE_URL || 'http://localhost:3000',

    // Collect trace on first retry
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video recording on failure
    video: 'retain-on-failure',

    // Network request logging
    actionTimeout: 15000,
    navigationTimeout: 30000,

    // Viewport size
    viewport: { width: 1920, height: 1080 },

    // Ignore HTTPS errors (for dev/staging environments)
    ignoreHTTPSErrors: true,

    // User agent
    userAgent: 'Playwright E2E Tests',
  },

  // Project configurations
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Add delay between actions to avoid rate limiting
        actionTimeout: 15000,
        navigationTimeout: 30000,
        headless: true, // Always run in headless mode
        launchOptions: {
          slowMo: 200, // Slow down execution to avoid rate limits
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
          ],
        },
      },
    },
  ],

  // Web server configuration (starts dev server if not running)
  webServer: {
    command: 'VITE_API_BASE_URL=${PLAYWRIGHT_API_BASE_URL:-http://127.0.0.1:8080} VITE_PROXY_TARGET=${PLAYWRIGHT_API_BASE_URL:-http://127.0.0.1:8080} npm run dev',
    url: process.env.PLAYWRIGHT_BASE_URL || process.env.BASE_URL || 'http://localhost:3000',
    reuseExistingServer: !process.env.CI, // Reuse server in dev, start fresh in CI
    timeout: 120 * 1000, // 2 minutes to start
    stdout: 'ignore',
    stderr: 'pipe',
  },

  // Output directories
  outputDir: 'test-results/',
});
