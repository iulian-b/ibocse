import { defineConfig, devices } from '@playwright/test';

/* Not 1998, where `npm start` runs, so the tests can run alongside it (and always test the build) */
const port = 1999;

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
	testDir: './tests',
	/* Run tests in files in parallel */
	fullyParallel: true,
	/* Fail the build on CI if you accidentally left test.only in the source code. */
	forbidOnly: !!process.env.CI,
	/* Retry on CI only */
	retries: process.env.CI ? 2 : 0,
	/* GitHub's runners have 4 cores; keep one free for the browsers' own work. */
	workers: process.env.CI ? 3 : undefined,
	/* Reporter to use. See https://playwright.dev/docs/test-reporters */
	reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'html',
	/* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
	use: {
		baseURL: `http://localhost:${port}`,
		/* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
		trace: 'on-first-retry',
	},

	/* Configure projects for major browsers */
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
		{
			name: 'firefox',
			use: { ...devices['Desktop Firefox'] },
		},
		{
			name: 'webkit',
			use: { ...devices['Desktop Safari'] },
		},
	],

	/* Test the production build, served like a static host would */
	webServer: {
		command: `npm run build && npm run preview -- --port ${port}`,
		url: `http://localhost:${port}`,
		reuseExistingServer: !process.env.CI,
		timeout: 180_000,
	},
});
