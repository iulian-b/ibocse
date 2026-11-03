import { test, expect, openDesktop, openStartMenu, windowTitled } from './fixtures';
import type { Page } from '@playwright/test';

async function openFind(page: Page, item: 'files' | 'computer' | 'internet') {
	await openStartMenu(page);
	await page.locator('#start_btn_find').hover();
	await page.locator(`#start_btn_find_${item}`).click(); // (it opens when pointed at)
}

/** Fills in Named (and Look in) and waits for the search to finish; returns the window. */
async function find(page: Page, named: string, { lookIn = '(C:)', subfolders = true } = {}) {
	const window = page.locator('.find-window');
	await window.locator('.tab', { hasText: 'Name & Location' }).dispatchEvent('pointerdown');
	await window.locator('input[type="text"]').fill(named);
	await window.locator('select').first().selectOption({ label: lookIn });
	await window.getByText('Include subfolders').locator('..').locator('input').setChecked(subfolders);
	await window.getByRole('button', { name: 'Find Now' }).click();
	await expect(window.locator('.status-bar')).toContainText('found', { timeout: 20_000 });
	return window;
}

function resultNames(window) {
	return window.locator('.find-result > div:first-child').allTextContents();
}

test('F3 on the desktop opens Find', async ({ page }) => {
	await openDesktop(page);
	await page.locator('#desktop').click({ position: { x: 600, y: 600 } });
	await page.keyboard.press('F3');
	await expect(windowTitled(page, 'Find: All Files')).toBeVisible();
});

test('Find opens from the Start menu', async ({ page }) => {
	await openDesktop(page);
	await openFind(page, 'files');
	await expect(windowTitled(page, 'Find: All Files')).toBeVisible();
	await expect(page.locator('.start-menu')).toBeHidden();
	await openFind(page, 'computer');
	await expect(windowTitled(page, 'Find: Computer')).toBeVisible();
	await openFind(page, 'internet');
	await expect(windowTitled(page, /google\.com/)).toBeVisible();
});

test('Find finds files and folders by name, without downloading anything', async ({ page }) => {
	await openDesktop(page);
	const downloads: string[] = [];
	page.on('request', (request) => downloads.push(decodeURIComponent(request.url())));
	await openFind(page, 'files');

	const window = await find(page, 'cv');
	await expect(windowTitled(page, 'Find: Files named cv')).toBeVisible();
	expect(await resultNames(window)).toEqual(['CV (EN).pdf', 'CV (RO).pdf']);
	await expect(window.locator('.status-bar')).toHaveText('2 file(s) found');
	await expect(window.locator('.find-result').first()).toContainText('C:\\My Documents');

	// (wildcards match whole names)
	await find(page, '*.exe', { lookIn: 'Windows', subfolders: false });
	const exes = await resultNames(window);
	expect(exes).toContain('Notepad.exe');
	expect(exes).toContain('Explorer.exe');
	expect(exes.every((name) => name.endsWith('.exe'))).toBe(true);

	await find(page, 'fonts');
	expect(await resultNames(window)).toEqual(['Fonts']);
	await expect(window.locator('.find-result')).toContainText('Folder');

	expect(downloads.filter((url) => url.includes('/C/'))).toEqual([]);
});

test('Find opens what it finds, and Windows\' own files say access is denied', async ({ page }) => {
	await openDesktop(page);
	await openFind(page, 'files');
	let window = await find(page, 'Win.ini');
	await window.locator('.find-result', { hasText: 'Win.ini' }).dblclick();
	await expect(windowTitled(page, /^Win\.ini$/)).toContainText('Insufficient permissions');
	await windowTitled(page, /^Win\.ini$/).getByRole('button', { name: 'OK' }).click();

	window = await find(page, 'CV (EN)');
	await window.locator('.find-result', { hasText: 'CV (EN).pdf' }).dblclick();
	await expect(windowTitled(page, 'CV (EN).pdf - PDF Viewer')).toBeVisible();
});

test('Find finds files by type, size and date', async ({ page }) => {
	await openDesktop(page);
	await openFind(page, 'files');
	const window = page.locator('.find-window');
	await window.locator('.tab', { hasText: 'Advanced' }).dispatchEvent('pointerdown');
	await window.locator('select').nth(1).selectOption({ label: 'Font' });
	await find(page, '', { lookIn: 'Windows' });
	const fonts = await resultNames(window);
	expect(fonts.length).toBeGreaterThan(0);
	expect(fonts.every((name) => /\.(ttf|fon)$/i.test(name))).toBe(true);

	await window.locator('.tab', { hasText: 'Advanced' }).dispatchEvent('pointerdown');
	await window.locator('select').nth(1).selectOption({ label: 'All Files and Folders' });
	await window.locator('select').nth(2).selectOption({ label: 'At least' });
	await window.locator('input[type="number"]').last().fill('10000');
	await find(page, '', { lookIn: 'Windows' });
	expect(await resultNames(window)).toEqual(['Win386.swp']);

	await window.locator('.tab', { hasText: 'Advanced' }).dispatchEvent('pointerdown');
	await window.locator('select').nth(2).selectOption({ label: '' });
	await window.locator('.tab', { hasText: 'Date Modified' }).dispatchEvent('pointerdown');
	await window.locator('input[type="date"]').first().fill('1995-07-01');
	await window.locator('input[type="date"]').last().fill('1995-07-31');
	await find(page, '*.exe', { lookIn: '(C:)' });
	const from_1995 = await resultNames(window);
	expect(from_1995).toContain('Explorer.exe');
	expect(from_1995).not.toContain('doom.exe');
});

test('Find can match capitals', async ({ page }) => {
	await openDesktop(page);
	await openFind(page, 'files');
	const window = await find(page, 'cv');
	await window.locator('.menu-button', { hasText: 'Options' }).dispatchEvent('pointerdown');
	await page.locator('.menu-item', { hasText: 'Case Sensitive' }).click();
	await find(page, 'cv');
	await expect(window.locator('.status-bar')).toHaveText('0 file(s) found');
	await find(page, 'CV');
	await expect(window.locator('.status-bar')).toHaveText('2 file(s) found');
});

test('Find: Computer finds the computers on the network', async ({ page }) => {
	await openDesktop(page);
	await openFind(page, 'computer');
	const window = page.locator('.find-window');
	await window.locator('input[type="text"]').fill('lab');
	await window.getByRole('button', { name: 'Find Now' }).click();
	await expect(window.locator('.status-bar')).toHaveText('2 computer(s) found', { timeout: 20_000 });
	await window.locator('.find-result', { hasText: 'LAB02' }).dblclick();
	await expect(windowTitled(page, 'Error')).toContainText('511 Network Authentication Required');
});
