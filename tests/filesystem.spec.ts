import { test, expect, openDesktop, windowTitled, writeFile } from './fixtures';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import type { Frame, Page } from '@playwright/test';

/** Calls a ZenFS fs function (callback style) in a page or frame, e.g. fsCall(page, 'readdir', '/'). */
function fsCall(target: Page | Frame, method: string, ...args: unknown[]) {
	return target.evaluate(([method, args]) => new Promise((resolve, reject) => {
		(window as any).withFilesystem(() => {
			(window as any).ZenFS.fs[method](...args, (error, result) => error ? reject(error) : resolve(result));
		});
	}), [method, args] as const);
}

test('every window shares the desktop\'s filesystem', async ({ page }) => {
	await openDesktop(page);
	await page.evaluate(() => (window as any).Notepad());
	await expect(windowTitled(page, 'Untitled - Notepad')).toBeVisible();
	const notepad = page.frames().find((frame) => frame.url().includes('programs/notepad'))!;
	expect(await notepad.evaluate(() => (window as any).is_filesystem_host)).toBe(false);

	// a file saved by a program is there for the desktop, and the other way around
	await fsCall(notepad, 'writeFile', '/Desktop/from notepad.txt', 'hello from Notepad');
	expect(await fsCall(page, 'readFile', '/Desktop/from notepad.txt', 'utf8')).toBe('hello from Notepad');
	await writeFile(page, '/My Documents/from desktop.txt', 'hello from the desktop');
	expect(await fsCall(notepad, 'readFile', '/My Documents/from desktop.txt', 'utf8')).toBe('hello from the desktop');
	// and the site's own files are read through the desktop too
	expect(await fsCall(notepad, 'readFile', '/My Documents/Geotagging Backup/autobkp1.kml', 'utf8')).toMatch(/^<\?xml/);
});

test('files the site serves can be deleted, and stay deleted', async ({ page }) => {
	await openDesktop(page);
	await page.evaluate(() => (window as any).Explorer('/My Documents/'));
	const folder = page.frameLocator('iframe[src*="programs/explorer"]').frameLocator('iframe');
	await folder.locator('.desktop-icon', { hasText: 'KET.pdf' }).click();
	await page.keyboard.press('Delete');
	await windowTitled(page, 'Confirm File Delete').getByRole('button', { name: 'Yes' }).click();
	await expect(folder.locator('.desktop-icon', { hasText: 'KET.pdf' })).toHaveCount(0);

	await openDesktop(page);
	expect(await fsCall(page, 'readdir', '/My Documents')).not.toContain('KET.pdf');
	expect(await fsCall(page, 'readdir', '/My Documents')).toContain('CV (EN).pdf');
});

test('deleting a folder deletes what\'s in it', async ({ page }) => {
	await openDesktop(page);
	await fsCall(page, 'mkdir', '/My Documents/Old stuff', 0o777);
	await writeFile(page, '/My Documents/Old stuff/a.txt', 'a');
	await writeFile(page, '/My Documents/Old stuff/b.txt', 'b');
	await page.evaluate(() => (window as any).Explorer('/My Documents/'));
	const folder = page.frameLocator('iframe[src*="programs/explorer"]').frameLocator('iframe');
	await folder.locator('.desktop-icon', { hasText: 'Old stuff' }).click();
	await page.keyboard.press('Delete');
	await windowTitled(page, 'Confirm File Delete').getByRole('button', { name: 'Yes' }).click();
	await expect(folder.locator('.desktop-icon', { hasText: 'Old stuff' })).toHaveCount(0);
	expect(await page.evaluate(() => new Promise((resolve) => (window as any).ZenFS.fs.exists('/My Documents/Old stuff/a.txt', resolve)))).toBe(false);
});

test('shutting down keeps the files on the drive as they were', async ({ page }) => {
	await openDesktop(page);
	await writeFile(page, '/Desktop/keep me.txt', 'kept');
	await fsCall(page, 'unlink', '/My Documents/KET.pdf');
	await page.evaluate(() => document.getElementById('start_btn_shutdown')!.click());
	// (skip the POST screen and boot sequence the next visit would show)
	await page.evaluate(() => { localStorage.setItem('POST', '1'); localStorage.setItem('boot', 'true'); });
	await openDesktop(page);
	expect(await fsCall(page, 'readFile', '/Desktop/keep me.txt', 'utf8')).toBe('kept');
	expect(await fsCall(page, 'readdir', '/My Documents')).not.toContain('KET.pdf');
});

test.describe('the drive index', () => {
	test.skip(({ browserName }) => browserName !== 'chromium', 'runs in Node; once is enough');

	test('lists everything in the C/ folder', () => {
		const { make_filesystem_index } = require('../scripts/filesystem-index.js');
		const site = fs.mkdtempSync(path.join(os.tmpdir(), 'drive-'));
		try {
			fs.mkdirSync(path.join(site, 'C', 'My Documents', 'Projects'), { recursive: true });
			fs.mkdirSync(path.join(site, 'C', 'Favorites'));
			fs.writeFileSync(path.join(site, 'C', 'My Documents', 'Projects', 'site.html'), '<p>hi</p>');
			fs.writeFileSync(path.join(site, 'C', 'Favorites', '.gitkeep'), '');
			fs.writeFileSync(path.join(site, 'C', 'My Documents', 'desktop.ini'), '');
			fs.writeFileSync(path.join(site, 'C', 'My Documents', 'C# notes.txt'), '');
			fs.writeFileSync(path.join(site, 'outside the drive.txt'), '');

			const warn = console.warn;
			const warnings: string[] = [];
			console.warn = (message) => warnings.push(message);
			const index = make_filesystem_index(site, { files: {} });
			console.warn = warn;

			expect(index.version).toBe(1);
			expect(Object.keys(index.entries)).toEqual(['/', '/Favorites', '/My Documents', '/My Documents/Projects', '/My Documents/Projects/site.html']);
			expect(index.entries['/My Documents/Projects/site.html']).toMatchObject({ size: 9, mode: 0o100644 });
			expect(index.entries['/My Documents/Projects']).toMatchObject({ mode: 0o40755 });
			expect(new Set(Object.values(index.entries).map((entry: any) => entry.ino)).size).toBe(5);
			expect(warnings).toEqual([expect.stringContaining('C# notes.txt')]);
		} finally {
			fs.rmSync(site, { recursive: true, force: true });
		}
	});

	test('lists Windows\' own files, which have nothing behind them, with no permissions', () => {
		const { make_filesystem_index } = require('../scripts/filesystem-index.js');
		const site = fs.mkdtempSync(path.join(os.tmpdir(), 'drive-'));
		try {
			fs.mkdirSync(path.join(site, 'C', 'Windows'), { recursive: true });
			fs.mkdirSync(path.join(site, 'C', 'My Documents'));
			fs.writeFileSync(path.join(site, 'C', 'Windows', 'Notepad.exe'), 'Notepad();\n');
			fs.writeFileSync(path.join(site, 'C', 'My Documents', 'notes.txt'), 'notes');
			const index = make_filesystem_index(site, {
				modified: '1995-07-11T09:50:00Z',
				files: {
					'Io.sys': 214416,
					'Windows': {
						'Notepad.exe': 34304, // (the real file is used)
						'Explorer.exe': 204288,
						'Plus!': { '@modified': '1995-07-31T12:00:00Z', 'Pinball': { 'Pinball.exe': 351744 } },
					},
				},
			});
			const win95 = Date.parse('1995-07-11T09:50:00Z');
			expect(index.entries['/Io.sys']).toMatchObject({ size: 214416, mode: 0o100000, mtimeMs: win95 });
			expect(index.entries['/Windows/Explorer.exe']).toMatchObject({ size: 204288, mode: 0o100000, mtimeMs: win95 });
			expect(index.entries['/Windows/Plus!']).toMatchObject({ mode: 0o40755, mtimeMs: Date.parse('1995-07-31T12:00:00Z') });
			expect(index.entries['/Windows/Plus!/Pinball/Pinball.exe']).toMatchObject({ mode: 0o100000, mtimeMs: Date.parse('1995-07-31T12:00:00Z') });
			// real files in Windows' folders are dated like them, and can be opened
			expect(index.entries['/Windows/Notepad.exe']).toMatchObject({ size: 11, mode: 0o100644, mtimeMs: win95 });
			expect(index.entries['/Windows']).toMatchObject({ mode: 0o40755, mtimeMs: win95 });
			// and the rest of the drive keeps its own dates
			expect(index.entries['/My Documents/notes.txt'].mtimeMs).toBe(Math.round(fs.statSync(path.join(site, 'C', 'My Documents', 'notes.txt')).mtimeMs));
			expect(new Set(Object.values(index.entries).map((entry: any) => entry.ino)).size).toBe(Object.keys(index.entries).length);
		} finally {
			fs.rmSync(site, { recursive: true, force: true });
		}
	});
});

test('Windows\' own files can be looked at, but not opened or downloaded', async ({ page }) => {
	await openDesktop(page);
	const downloads: string[] = [];
	page.on('request', (request) => downloads.push(decodeURIComponent(request.url())));
	await page.evaluate(() => (window as any).Explorer('/Program Files/Accessories/'));
	const folder = page.frameLocator('iframe[src*="programs/explorer"]').frameLocator('iframe');
	await folder.locator('.desktop-icon', { hasText: 'Wordpad.exe' }).dblclick();
	await expect(windowTitled(page, 'Wordpad.exe')).toContainText('Insufficient permissions');
	await windowTitled(page, 'Wordpad.exe').getByRole('button', { name: 'OK' }).click();

	// (a picture would be shown when it's selected)
	await page.evaluate(() => (window as any).Explorer('/Windows/'));
	const windows = page.frameLocator('iframe[src*="Windows"]').frameLocator('iframe');
	await windows.locator('.desktop-icon', { hasText: 'Clouds.bmp' }).click();
	await page.evaluate(() => (window as any).systemExecuteFile('/Windows/Win.ini'));
	await expect(windowTitled(page, 'Win.ini')).toContainText('Insufficient permissions');
	expect(downloads.filter((url) => /\/C\/(Program Files|Windows)\//.test(url))).toEqual([]);
});

test('the programs in C:\\Windows run', async ({ page }) => {
	await openDesktop(page);
	const programs: [path: string, title: string | RegExp][] = [
		['/Windows/Notepad.exe', 'Untitled - Notepad'],
		['/Windows/Calc.exe', 'Calculator'],
		['/Windows/Winmine.exe', 'Minesweeper'],
		['/Windows/Sol.exe', 'Solitaire'],
		['/Windows/Pbrush.exe', 'untitled - Paint'],
		['/Windows/Command.com', 'MS-DOS Prompt'],
		['/Windows/Iexplore.exe', /google\.com/],
		['/Windows/Netwatch.exe', /^Network$/],
		['/Windows/Pinball.exe', /Space Cadet$/],
	];
	for (const [file_path, title] of programs) {
		await page.evaluate((file_path) => (window as any).systemExecuteFile(file_path), file_path);
		await expect(windowTitled(page, title)).toBeVisible({ timeout: 15_000 });
	}
	for (const screensaver of ['/Windows/System/3D Pipes (OpenGL).scr', '/Windows/System/3D Flower Box (OpenGL).scr']) {
		await page.evaluate((file_path) => (window as any).systemExecuteFile(file_path), screensaver);
		await expect(page.locator('body > iframe')).toBeVisible();
		await page.keyboard.press('Escape');
		await expect(page.locator('body > iframe')).toHaveCount(0);
	}
});
