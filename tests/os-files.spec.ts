import { test, expect, openDesktop, windowTitled, desktopIcon, run } from './fixtures';
import * as fs from 'fs';
import * as path from 'path';
import type { Frame, Page } from '@playwright/test';

// Each operating system shows only some of the desktop's icons and the drive's files: what its files.json says (src/os-files.js)

/** Calls a ZenFS fs function (callback style) in a page or frame: its result, or its error's code. */
function fsCall(target: Page | Frame, method: string, ...args: unknown[]) {
	return target.evaluate(([method, args]) => new Promise((resolve) => {
		(window as any).withFilesystem(() => {
			(window as any).ZenFS.fs[method](...args, (error, result) => resolve(error ? { code: error.code } : result));
		});
	}), [method, args] as const);
}

/** The desktop of the network's operating system, Sinclair OS (as the boot menu boots it) */
async function openNetworkDesktop(page: Page) {
	await page.addInitScript(() => localStorage.setItem('boot-device', 'network'));
	await openDesktop(page);
}

test("the network's desktop has the programs, but not the games or the site's own files, and no gaps where they'd be", async ({ page }) => {
	await openNetworkDesktop(page);
	for (const title of ['My Computer', 'My Documents', 'Recycle Bin', 'Notepad', 'Paint', 'Winamp', 'Calculator', 'Terminal', 'Minesweeper', 'Solitaire', 'Pinball']) {
		await expect(desktopIcon(page, title)).toBeVisible();
	}
	for (const title of ['Diablo', 'Doom', 'Wolfenstein', 'Cyberpunk 2077', 'CV (EN).pdf', 'CV (RO).pdf']) {
		await expect(desktopIcon(page, title)).toHaveCount(0);
	}
	// (top to bottom, then left to right, one after another)
	const { rows, slots } = await page.locator('.desktop > .folder-view').evaluate((desktop) => ({
		rows: Math.floor(desktop.clientHeight / 75),
		slots: [...desktop.querySelectorAll<HTMLElement>('.desktop-icon')].map((icon) => [parseFloat(icon.style.left) / 75, parseFloat(icon.style.top) / 75]),
	}));
	const places = slots.map(([column, row]) => column * rows + row).sort((a, b) => a - b);
	expect(places).toEqual(places.map((_, index) => index));
});

test("the network's drive has Windows' files, but not the games or the site's own, in every window", async ({ page }) => {
	await openNetworkDesktop(page);
	const root = await fsCall(page, 'readdir', '/');
	expect(root).toEqual(expect.arrayContaining(['Windows', 'Program Files', 'My Documents', 'My Music', 'Recycle Bin']));
	expect(root).not.toContain('Games');
	expect(await fsCall(page, 'readdir', '/My Documents')).toEqual([]);
	expect(await fsCall(page, 'readdir', '/My Music')).toEqual([]);
	expect(await fsCall(page, 'readdir', '/Recycle Bin')).toEqual([]);
	// (its programs, and the files Windows has for show)
	expect(await fsCall(page, 'readdir', '/Windows')).toEqual(expect.arrayContaining(['Notepad.exe', 'Winmine.exe', 'Explorer.exe']));
	expect(await fsCall(page, 'stat', '/My Documents/CV (EN).pdf')).toEqual({ code: 'ENOENT' });
	expect(await fsCall(page, 'readdir', '/Games')).toEqual({ code: 'ENOENT' });
	// (and nothing can be put in their place)
	expect(await fsCall(page, 'writeFile', '/My Documents/CV (EN).pdf', 'mine')).toEqual({ code: 'EACCES' });

	// A program's window sees the drive the same way (through the desktop)
	await page.evaluate(() => (window as any).Explorer('/'));
	const folder = page.frameLocator('iframe[src*="programs/explorer"]').frameLocator('iframe');
	await expect(folder.locator('.desktop-icon', { hasText: 'Windows' })).toBeVisible();
	await expect(folder.locator('.desktop-icon', { hasText: 'Games' })).toHaveCount(0);
	const explorer = page.frames().find((frame) => frame.url().includes('programs/explorer'))!;
	expect(await fsCall(explorer, 'stat', '/My Documents/CV (EN).pdf')).toEqual({ code: 'ENOENT' });
	expect(await fsCall(explorer, 'readdir', '/My Pictures')).toEqual([]);

	// Run doesn't find them
	await run(page, 'doom.exe');
	await expect(windowTitled(page, 'doom.exe')).toContainText("Cannot find the file 'doom.exe'");
	await run(page, '/My Documents/CV (RO).pdf');
	await expect(windowTitled(page, 'CV (RO).pdf')).toContainText('Cannot find the file');
});

test('the network has no games to remove, and no CV to open at startup', async ({ page }) => {
	await openNetworkDesktop(page);
	await page.evaluate(() => (window as any).AddRemovePrograms());
	const programs = windowTitled(page, 'Add/Remove Programs Properties');
	await expect(programs.getByRole('listbox')).toBeVisible();
	await expect(programs.getByRole('option')).toHaveCount(0);

	await page.evaluate(() => (window as any).SystemProperties());
	const system = windowTitled(page, 'System Properties');
	await system.locator('.tab', { hasText: 'Startup' }).dispatchEvent('pointerdown');
	await expect(system.locator('.startup-list')).toBeVisible();
	await expect(system.locator('.startup-list .list-item')).toHaveCount(0);
	await expect(windowTitled(page, 'CV (EN).pdf - PDF Viewer')).toHaveCount(0);
});

test("what the network doesn't show stays there for the hard disk's", async ({ page }) => {
	await openDesktop(page);
	await page.evaluate(() => localStorage.setItem('boot-device', 'network'));
	await openDesktop(page);
	// (a folder with things it doesn't show in it can't be deleted or moved)
	expect(await fsCall(page, 'rm', '/My Documents', { recursive: true })).toEqual({ code: 'ENOTEMPTY' });
	expect(await fsCall(page, 'rename', '/My Music', '/Music')).toEqual({ code: 'EACCES' });

	await page.evaluate(() => localStorage.removeItem('boot-device'));
	await openDesktop(page);
	expect(await fsCall(page, 'readdir', '/My Documents')).toContain('CV (EN).pdf');
	expect(await fsCall(page, 'readdir', '/My Music')).toContain('blue.mp3');
	expect(await fsCall(page, 'readdir', '/')).toContain('Games');
	await expect(desktopIcon(page, 'Doom')).toBeVisible();
	await expect(desktopIcon(page, 'CV (EN).pdf')).toBeVisible();
});

test.describe('files.json', () => {
	test.skip(({ browserName }) => browserName !== 'chromium', 'checks files; once is enough');

	test("each operating system's lists every desktop icon and every file in C/, and only those", async ({ page }) => {
		const root = path.resolve(__dirname, '..');
		const { make_filesystem_index } = require('../scripts/filesystem-index.js');
		// (the site's own files: not Windows', which are only on the drive for show)
		const drive = Object.keys(make_filesystem_index(root, { modified: '1995-07-11T09:50:00Z', files: {} }).entries).filter((file) => file !== '/');
		await openDesktop(page);
		const icons: string[] = await page.evaluate(() => (window as any).desktop_icons.map(({ title }) => title));
		const lists: Record<string, string> = await page.evaluate('Object.fromEntries(Object.entries(operating_systems).map(([id, os]) => [id, os.files]))');
		expect(Object.keys(lists).length).toBeGreaterThan(1);
		for (const [os, file] of Object.entries(lists)) {
			const list = JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
			expect(Object.keys(list.desktop).sort(), `${file}: the desktop's icons`).toEqual([...icons].sort());
			expect(Object.keys(list.drive).sort(), `${file}: the files in C/`).toEqual([...drive].sort());
			expect(Object.values({ ...list.desktop, ...list.drive }).every((shown) => typeof shown === 'boolean'), `${os}: true or false`).toBe(true);
		}
	});
});
