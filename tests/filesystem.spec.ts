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
			const index = make_filesystem_index(site);
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
});
