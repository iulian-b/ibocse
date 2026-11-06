import { test as base, expect, type Page, type Locator } from '@playwright/test';

export { expect };

type Fixtures = {
	/** Skip the first-boot animation and POST screen (default). Set to false to test them. */
	booted: boolean;
	/** Problems a test expects; anything else in `problems` fails the test. */
	allowedProblems: RegExp[];
	/** Uncaught errors, CSP violations and failed requests to the site, from every page and frame. */
	problems: string[];
	/** Console messages starting with XSS-MARK, which the security tests' payloads log if they run. */
	xssMarkers: string[];
};

export const test = base.extend<Fixtures>({
	booted: [true, { option: true }],
	allowedProblems: async ({}, use) => {
		await use([]);
	},
	xssMarkers: async ({ context }, use) => {
		const markers: string[] = [];
		context.on('console', (message) => {
			if (message.text().startsWith('XSS-MARK')) {
				markers.push(message.text());
			}
		});
		await use(markers);
	},
	problems: [async ({ context, booted, allowedProblems, baseURL }, use) => {
		const problems: string[] = [];
		// Runs in every page and frame, before the page's own scripts.
		await context.addInitScript(() => {
			const report = (kind: string, detail: string) => console.error(`[problem:${kind}] ${detail}`);
			addEventListener('error', (event) => {
				if (/ResizeObserver loop/.test(event.message)) {
					return; // a benign browser notice, not an error in the page
				}
				report('error', `${event.message} @ ${event.filename}:${event.lineno}`);
			});
			addEventListener('unhandledrejection', (event) => report('rejection', String(event.reason?.stack ?? event.reason)));
			addEventListener('securitypolicyviolation', (event) => report('csp', `${event.effectiveDirective} blocked ${event.blockedURI || '(inline)'} at ${event.sourceFile}:${event.lineNumber}`), true);
		});
		if (booted) {
			await context.addInitScript((siteOrigin) => {
				// Like a visitor who has been here before (and never shut down, so never saw the POST screen).
				// Once per tab (sessionStorage), so a test can still shut down and see the next boot.
				try {
					if (location.origin === siteOrigin && !sessionStorage.getItem('test-skipped-boot')) {
						sessionStorage.setItem('test-skipped-boot', 'true');
						localStorage.setItem('boot', 'true');
					}
				} catch {
					// sandboxed frames have no storage
				}
			}, new URL(baseURL!).origin);
		}
		// Keep tests independent of other websites (external games, the Wayback Machine, GitHub):
		// pages from them are replaced by a stub (so frames still finish loading), anything else is blocked.
		await context.route((url) => url.protocol.startsWith('http') && url.origin !== new URL(baseURL!).origin, (route) =>
			route.request().resourceType() === 'document'
				? route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Other website (stubbed in tests)</title>' })
				: route.abort());
		context.on('console', (message) => {
			if (message.text().startsWith('[problem:')) {
				problems.push(message.text());
			}
		});
		context.on('response', (response) => {
			if (response.url().startsWith(baseURL!) && response.status() >= 400) {
				problems.push(`HTTP ${response.status()} ${decodeURI(response.url())}`);
			}
		});
		await use(problems);
		const unexpected = problems.filter((problem) => !allowedProblems.some((pattern) => pattern.test(problem)));
		expect(unexpected, 'errors, CSP violations or failed requests during the test').toEqual([]);
	}, { auto: true }],
});

/** Loads the desktop and closes the CV window it opens on startup, so tests start from an empty desktop. */
export async function openDesktop(page: Page) {
	await page.goto('/');
	await page.waitForFunction(() => (window as any).folder_view && typeof (window as any).systemExecuteFile === 'function');
	// (the black cover shown while the page loads; it once stayed up for good on returning visits)
	await expect(page.locator('#preloader')).toBeHidden();
	// (where the operating system has it: src/os-files.js)
	if (await page.evaluate('is_shown_on_drive(startup_cv_path)')) {
		const cv = page.locator('iframe[src*="programs/pdfviewer"]');
		await cv.waitFor({ state: 'attached' });
		await cv.evaluate((iframe: any) => iframe.$window.close());
	}
	await expect(page.locator('.os-window')).toHaveCount(0);
}

/** Sound Recorder and Winamp need Web Audio, which some browser builds lack (Playwright's WebKit on Windows). */
export async function skipWithoutWebAudio(page: Page) {
	test.skip(!(await page.evaluate(() => 'AudioContext' in window)), 'no Web Audio in this browser build');
}

export function windowTitled(page: Page, title: string | RegExp): Locator {
	return page.locator('.os-window').filter({ has: page.locator('.window-title', { hasText: title }) });
}

export function desktopIcon(page: Page, title: string): Locator {
	return page.locator('.desktop-icon').filter({ has: page.getByText(title, { exact: true }) });
}

export async function openStartMenu(page: Page) {
	await page.locator('.start-button').dispatchEvent('pointerdown');
	await expect(page.locator('.start-menu')).toBeVisible();
	await page.waitForTimeout(300); // let it finish sliding open
}

/** Writes a file to the desktop's virtual filesystem; it ends up in the browser's storage, like files saved by programs. */
export async function writeFile(page: Page, path: string, content: string | Buffer) {
	const bytes = typeof content === 'string' ? null : [...content];
	await page.evaluate(([path, text, bytes]) => new Promise<void>((resolve, reject) => {
		(window as any).withFilesystem(() => {
			const data = bytes === null ? text : new Uint8Array(bytes);
			(window as any).ZenFS.fs.writeFile(path, data, (error) => error ? reject(error) : resolve());
		});
	}), [path, typeof content === 'string' ? content : '', bytes] as const);
}

/** Types a command into Start > Run and submits it. */
export async function run(page: Page, command: string) {
	await page.evaluate(() => (window as any).openRunDialog());
	const dialog = page.frameLocator('iframe[src*="programs/run"]');
	await dialog.locator('#target').fill(command);
	await dialog.locator('#target').press('Enter');
	await expect(windowTitled(page, 'Run')).toHaveCount(0);
}
