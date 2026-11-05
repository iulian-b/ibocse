import { test, expect, openDesktop, windowTitled, writeFile } from './fixtures';

// Each payload logs "XSS-MARK" if it ever runs.

test.describe('XSS', () => {
	test.afterEach(async ({ page, xssMarkers }) => {
		await page.waitForTimeout(1000); // give payloads a chance to run
		expect(xssMarkers).toEqual([]);
	});

	test('PicView ?path', async ({ page }) => {
		await page.goto('/programs/picview/index.html?path=' + encodeURIComponent(`x" onerror="console.log('XSS-MARK picview')`));
	});

	test('PDF Viewer ?path', async ({ page }) => {
		await openDesktop(page);
		await page.evaluate(() => (window as any).make_iframe_window({
			src: 'programs/pdfviewer/index.html?path=' + encodeURIComponent(`x"><img src=x onerror="console.log('XSS-MARK pdfviewer')">`),
			title: 'probe', outerWidth: 300, outerHeight: 300,
		}));
		await expect(windowTitled(page, /PDF Viewer$/)).toBeVisible();
	});

	test('Markdown files in MDView', async ({ page }) => {
		await openDesktop(page);
		await writeFile(page, '/My Documents/evil.md', `<img src=x onerror="console.log('XSS-MARK mdview')">\n\n[click me](javascript:console.log('XSS-MARK mdview-link'))\n`);
		await page.evaluate(() => (window as any).systemExecuteFile('/My Documents/evil.md'));
		const markdown = page.frameLocator('iframe[src*="programs/mdview"]').locator('#document');
		await expect(markdown).toContainText('<img src=x');
		await expect(markdown).toContainText('click me');
		await expect(markdown.locator('a')).toHaveCount(0);
	});

	test('.exe file contents', async ({ page }) => {
		await openDesktop(page);
		await writeFile(page, '/My Documents/evil.exe', `console.log('XSS-MARK exe')\n`);
		await page.evaluate(() => (window as any).openWithProgram('/My Documents/evil.exe'));
		await expect(windowTitled(page, 'evil.exe')).toBeVisible();
	});

	test('.url file with a javascript: URL', async ({ page, context }) => {
		await openDesktop(page);
		await writeFile(page, '/My Documents/evil.url', `[InternetShortcut]\nURL=javascript:opener.console.log('XSS-MARK url')\n`);
		let popups = 0;
		context.on('page', () => popups++);
		await page.evaluate(() => (window as any).openURLFile('/My Documents/evil.url'));
		await expect(windowTitled(page, /^Windows$/)).toBeVisible(); // "Cannot open ..." message box
		expect(popups).toBe(0);
	});

	test('file names in the folder sidebar', async ({ page, allowedProblems }) => {
		const name = `<img src=x onerror=console.log('XSS-MARK-htt')>.txt`;
		// the sidebar's preview fetches the file from the server, but it only exists in the browser's storage
		allowedProblems.push(/HTTP 404 .*XSS-MARK-htt/);
		await openDesktop(page);
		await writeFile(page, '/My Documents/' + name, 'hi');
		await page.evaluate(() => (window as any).Explorer('/My Documents/'));
		const folder = page.frameLocator('iframe[src*="programs/explorer"]').frameLocator('iframe');
		await folder.getByText(name, { exact: true }).click();
		await expect(folder.locator('#Info')).toContainText(name);
	});

	test.describe('user agent in the boot screen', () => {
		test.use({ booted: false, userAgent: `Mozilla/5.0 <img src=x onerror="console.log('XSS-MARK ua')">` });
		test('is shown as text', async ({ page }) => {
			await page.goto('/', { waitUntil: 'domcontentloaded' }); // (the boot screen only lasts a few seconds)
			await expect(page.locator('#bootloader')).toContainText('<img src=x');
		});
	});
});

test('third-party code is never loaded by the site\'s own pages', async ({ page, context, baseURL }) => {
	test.slow();
	const thirdParty: string[] = [];
	context.on('request', (request) => {
		let frameURL = '';
		try {
			frameURL = request.frame().url();
		} catch {
			return; // service worker
		}
		const fromOurPage = frameURL.startsWith(baseURL!) || frameURL.startsWith('about:');
		if (fromOurPage && !request.url().startsWith(baseURL!) && /^(https?|wss?):/.test(request.url()) &&
			['script', 'xhr', 'fetch', 'stylesheet', 'font', 'websocket'].includes(request.resourceType())) {
			thirdParty.push(`${request.resourceType()} ${request.url()}`);
		}
	});
	await openDesktop(page);
	const programs = ['Notepad', 'Paint', 'Minesweeper', 'Solitaire', 'Calculator', 'CommandPrompt', 'Pipes'];
	if (await page.evaluate(() => 'AudioContext' in window)) {
		programs.push('SoundRecorder', 'openWinamp'); // these need Web Audio, which some browser builds lack
	}
	for (const program of programs) {
		await page.evaluate((program) => (window as any)[program](), program);
		await page.waitForTimeout(1500);
		await page.keyboard.press('Escape'); // closes a screensaver
	}
	await page.evaluate(() => (window as any).Explorer('/'));
	await page.waitForTimeout(1500);
	await page.goto('/$POST.html');
	await page.waitForTimeout(1000);
	expect(thirdParty).toEqual([]);
});

test('external games are sandboxed', async ({ page }) => {
	await openDesktop(page);
	await page.evaluate(() => {
		for (const game of ['Diablo', 'Wolf3d', 'SkiFree', 'TombRaider', 'CommanderKeen', 'Doom', 'CaveStory', 'ArxFatalis',
			'BattleCity', 'CounterStrike', 'Daggerfall', 'DukeNukem3D', 'PrinceOfPersia', 'Sonic', 'SuperMario64', 'Wipeout', 'Quake3',
			'Minecraft']) {
			(window as any)[game]();
		}
	});
	const iframes = page.locator('.os-window iframe');
	await expect(iframes).toHaveCount(18);
	for (const iframe of await iframes.all()) {
		const sandbox = await iframe.getAttribute('sandbox');
		expect(sandbox).toContain('allow-scripts');
		expect(sandbox).not.toContain('allow-top-navigation');
	}
});

test('pages from this site open in Explorer without access to the desktop', async ({ page, allowedProblems }) => {
	// the help page, now in an opaque origin, can't use localStorage; os-gui can't integrate with it either
	allowedProblems.push(/SecurityError.*localStorage/);
	await openDesktop(page);
	await page.evaluate(() => (window as any).Explorer(location.origin + '/help/default.html'));
	const content = page.frameLocator('iframe[src*="programs/explorer"]').locator('#content iframe');
	await expect(content).toHaveAttribute('sandbox', /allow-scripts/);
	await expect(content).not.toHaveAttribute('sandbox', /allow-same-origin/);
});

test('the desktop has a Content-Security-Policy without inline scripts', async ({ page }) => {
	await page.goto('/');
	const policy = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
	const scriptSrc = policy!.split(';').map((directive) => directive.trim()).find((directive) => directive.startsWith('script-src'))!;
	expect(scriptSrc).not.toContain("'unsafe-inline'");
	expect(policy).toContain("object-src 'none'");
	expect(await page.locator('[onclick], [onload], [onerror], [onsubmit]').count()).toBe(0);
});
