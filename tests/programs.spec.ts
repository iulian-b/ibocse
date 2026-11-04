import { test, expect, openDesktop, windowTitled, desktopIcon, skipWithoutWebAudio, writeFile } from './fixtures';

test('Notepad inserts the time and date, and saves files', async ({ page }) => {
	await page.goto('/programs/notepad/index.html');
	const textarea = page.locator('#document-textarea');
	await textarea.fill('hello');
	await textarea.press('End');
	await textarea.press('F5');
	await expect(textarea).toHaveValue(/^hello\d{1,2}:\d{2} [AP]M \d{1,2}\/\d{1,2}\/\d{4}$/);

	const [download] = await Promise.all([page.waitForEvent('download'), page.evaluate(() => (window as any).file_save_as())]);
	expect(download.suggestedFilename()).toBe('Untitled.txt');
	const saved = require('fs').readFileSync(await download.path(), 'utf8');
	expect(saved).toBe(await textarea.inputValue());
});

test('Calculator can do some math', async ({ page }) => {
	await openDesktop(page);
	await desktopIcon(page, 'Calculator').dblclick();
	const calculator = page.frameLocator('iframe[src*="programs/calculator"]');
	await calculator.getByRole('button', { name: '1' }).click();
	await calculator.getByLabel('add').click();
	await calculator.getByRole('button', { name: '2' }).click();
	await calculator.getByLabel('equals').click();
	await expect(calculator.getByRole('textbox')).toHaveValue('3');
});

test('Explorer lists a folder and can start renaming a file', async ({ page }) => {
	await openDesktop(page);
	await desktopIcon(page, 'My Documents').dblclick();
	const explorer = page.frameLocator('iframe[src*="programs/explorer"]');
	await expect(explorer.getByText(/^\d+ object\(s\)$/)).toBeVisible();
	const folder = explorer.frameLocator('iframe');
	const item = folder.locator('.desktop-icon').filter({ hasText: 'CV (EN).pdf' });
	await item.click();
	await expect(item).toHaveClass(/(^|\s)selected(\s|$)/);
	await page.waitForTimeout(1000); // avoid a double click
	await item.click();
	await expect(folder.getByRole('textbox')).toBeFocused();
	await expect(folder.getByRole('textbox')).toHaveValue('CV (EN).pdf');
});

test('Explorer shows a thumbnail of the selected picture', async ({ page }) => {
	await openDesktop(page);
	await page.evaluate(() => (window as any).Explorer('/My Pictures/'));
	const folder = page.frameLocator('iframe[src*="programs/explorer"]').frameLocator('iframe');
	await folder.locator('.desktop-icon', { hasText: '20170225_160324.jpg' }).click();
	await expect(folder.locator('#Thumbnail')).toBeVisible({ timeout: 15_000 }); // (the whole photo)
	await expect(folder.locator('#Thumbnail img')).toHaveAttribute('src', '/C/My%20Pictures/20170225_160324.jpg');
});

test('Explorer doesn\'t download other kinds of files just for selecting them', async ({ page }) => {
	await openDesktop(page);
	await page.evaluate(() => (window as any).Explorer('/My Documents/Geotagging Backup/Sessions/01Oct2019/'));
	const folder = page.frameLocator('iframe[src*="programs/explorer"]').frameLocator('iframe');
	const downloads: string[] = [];
	page.on('request', (request) => downloads.push(request.url()));
	await folder.locator('.desktop-icon', { hasText: 'dHJp.wav' }).click();
	await expect(folder.locator('#Info')).toContainText('dHJp.wav');
	await page.waitForTimeout(500);
	expect(downloads.filter((url) => url.includes('/C/'))).toEqual([]);
});

test('PicView shows a picture, in a window shaped like it', async ({ page }) => {
	await openDesktop(page);
	await page.evaluate(() => (window as any).systemExecuteFile('/My Pictures/20170225_160324.jpg'));
	await expect(windowTitled(page, '20170225_160324.jpg - PicView')).toBeVisible();
	const picture = page.frameLocator('iframe[src*="programs/picview"]').locator('#pic');
	await expect(picture).toHaveAttribute('src', '/C/My%20Pictures/20170225_160324.jpg');
	await expect.poll(() => picture.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(2048);
	// 2048x1536, shrunk to fit the screen
	const content = page.locator('iframe[src*="programs/picview"]');
	await expect.poll(async () => {
		const box = (await content.boundingBox())!;
		return Math.round(box.width / box.height * 100) / 100;
	}).toBe(1.33);
	const windowBox = (await windowTitled(page, /PicView$/).boundingBox())!;
	expect(windowBox.y + windowBox.height).toBeLessThanOrEqual((await page.locator('.taskbar').boundingBox())!.y);
});

test('PicView shows a picture that only exists in the browser', async ({ page }) => {
	await openDesktop(page);
	await writeFile(page, '/My Pictures/saved.png', require('fs').readFileSync(require('path').resolve(__dirname, '..', 'images', 'start.png')));
	await page.evaluate(() => (window as any).systemExecuteFile('/My Pictures/saved.png'));
	const picture = page.frameLocator('iframe[src*="programs/picview"]').locator('#pic');
	await expect(picture).toHaveAttribute('src', /^blob:/);
	await expect.poll(() => picture.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(16);
});

test('PDF Viewer embeds the document', async ({ page }) => {
	await openDesktop(page);
	await desktopIcon(page, 'CV (RO).pdf').dblclick();
	const embed = page.frameLocator('iframe[src*="programs/pdfviewer"]').locator('embed');
	await expect(embed).toHaveAttribute('src', '/C/My%20Documents/CV%20(RO).pdf');
});

test.describe('on a laptop screen', () => {
	test.use({ viewport: { width: 1366, height: 768 } });
	test('the CV opened at startup fits on the screen', async ({ page }) => {
		await page.goto('/');
		const cv = windowTitled(page, 'CV (EN).pdf - PDF Viewer');
		await expect(cv).toBeVisible();
		const box = (await cv.boundingBox())!;
		expect(box.x).toBeGreaterThanOrEqual(0);
		expect(box.y).toBeGreaterThanOrEqual(0);
		expect(box.x + box.width).toBeLessThanOrEqual(1366);
		expect(box.y + box.height).toBeLessThanOrEqual((await page.locator('.taskbar').boundingBox())!.y);
	});
});

test('MDView shows Markdown files', async ({ page }) => {
	await openDesktop(page);
	await writeFile(page, '/My Documents/notes.md', '# Notes\n\n- one\n- two\n\nSee [the project](https://github.com/iulian-b/ibocse).\n');
	await page.evaluate(() => (window as any).systemExecuteFile('/My Documents/notes.md'));
	await expect(windowTitled(page, 'notes.md - MDView')).toBeVisible();
	const markdown = page.frameLocator('iframe[src*="programs/mdview"]').locator('#document');
	await expect(markdown.locator('h1')).toHaveText('Notes');
	await expect(markdown.locator('li')).toHaveText(['one', 'two']);
	const link = markdown.getByRole('link', { name: 'the project' });
	await expect(link).toHaveAttribute('href', 'https://github.com/iulian-b/ibocse');
	await expect(link).toHaveAttribute('target', '_blank');
});

test('Notepad opens .kml files', async ({ page }) => {
	await openDesktop(page);
	await page.evaluate(() => (window as any).systemExecuteFile('/My Documents/Geotagging Backup/autobkp1.kml'));
	await expect(windowTitled(page, 'autobkp1.kml - Notepad')).toBeVisible();
	await expect(page.frameLocator('iframe[src*="programs/notepad"]').locator('#document-textarea')).toHaveValue(/^<\?xml[^]*<kml /);
});

test('Sound Recorder has its position slider', async ({ page }) => {
	await openDesktop(page);
	await skipWithoutWebAudio(page);
	await desktopIcon(page, 'Sound Recorder').dblclick();
	await expect(page.frameLocator('iframe[src*="programs/sound-recorder"]').locator('.ui-slider-handle')).toBeVisible();
});

test('MS-DOS Prompt boots the emulator', async ({ page }) => {
	test.slow(); // downloads and starts a 5 MB emulator
	await openDesktop(page);
	await desktopIcon(page, 'Terminal').dblclick();
	await expect(page.frameLocator('iframe[src*="programs/command"]').locator('#dosbox canvas')).toBeVisible({ timeout: 45_000 });
});

test('Winamp plays a song, and can be closed and opened again', async ({ page }) => {
	test.slow(); // (in Firefox, loading Winamp and the song can take over 15 seconds while the other tests run)
	await openDesktop(page);
	await skipWithoutWebAudio(page);
	await page.evaluate(() => (window as any).systemExecuteFile('/My Music/blue.mp3'));
	await expect(page.locator('.tasks .task .title', { hasText: /^1\. blue - Winamp/ })).toBeVisible({ timeout: 30_000 });
	await page.evaluate('winamp_interface.close()');
	await expect(page.locator('#webamp')).toHaveCount(0);
	await page.evaluate(() => (window as any).openWinamp());
	await expect(page.locator('#webamp #main-window')).toBeVisible({ timeout: 15_000 });
});

test('VMware boots this site as its guest OS', async ({ page }) => {
	await openDesktop(page);
	await desktopIcon(page, 'VMware 2.0').dblclick();
	const guest = page.frameLocator('iframe[src*="programs/vmware"]').frameLocator('iframe');
	await expect(guest.locator('#taskbar')).toBeVisible({ timeout: 15_000 });
	await expect(guest.locator('.desktop-icon').first()).toBeVisible();
});

test('Paint can open a file dropped onto the desktop', async ({ page, browserName }) => {
	test.skip(browserName === 'webkit', 'WebKit does not support DataTransferItemList fully');
	await openDesktop(page);
	const buffer = require('fs').readFileSync(require('path').resolve(__dirname, '..', 'images', 'start.png'));
	// Named .bmp so it opens in Paint (.png opens in PicView); Paint goes by the content, which is a PNG
	const dataTransfer = await page.evaluateHandle((hex) => {
		const dt = new DataTransfer();
		const bytes = new Uint8Array(hex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));
		dt.items.add(new File([bytes], 'start.bmp', { type: 'image/bmp' }));
		return dt;
	}, buffer.toString('hex'));
	await page.locator('.desktop .folder-view').dispatchEvent('drop', { dataTransfer, clientX: 400, clientY: 300 });
	await desktopIcon(page, 'start.bmp').dblclick();
	const paint = page.frameLocator('iframe[src*="programs/jspaint"]');
	await expect(paint.locator('.main-canvas')).toHaveAttribute('width', '16');
	await expect(paint.locator('.main-canvas')).toHaveAttribute('height', '14');
	await expect(windowTitled(page, /Paint$/)).toBeVisible();
});

test('Paint can set the wallpaper (tiled)', async ({ page }) => {
	test.skip(!!process.env.CI, 'JS Paint needs WebGL, which CI runners lack');
	await openDesktop(page);
	await desktopIcon(page, 'Paint').dblclick();
	const paint = page.frameLocator('iframe[src*="programs/jspaint"]');
	// Paint's menus are part of the desktop's window, outside the iframe
	await page.getByText('Image', { exact: true }).click();
	await page.getByText('Attributes...').click();
	await paint.getByLabel('Width:').fill('10');
	await paint.getByLabel('Height:').fill('10');
	await paint.getByLabel('Height:').press('Enter');
	await paint.getByTitle('Fill With Color').click();
	await paint.locator('.swatch:nth-child(18)').click();
	await paint.locator('.main-canvas').click({ position: { x: 5, y: 5 } });
	await page.getByRole('menuitem', { name: 'File' }).click();
	await page.getByText('Set As Wallpaper (Tiled)').click();
	await expect(page.locator('.desktop')).toHaveCSS('background-image', /url\("blob:/);
});
