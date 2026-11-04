import { test, expect, openDesktop, openStartMenu, windowTitled, desktopIcon, writeFile } from './fixtures';
import type { Page } from '@playwright/test';

/** Calls a ZenFS fs function (callback style) on the desktop, e.g. fsCall(page, 'readdir', '/'). */
function fsCall(page: Page, method: string, ...args: unknown[]) {
	return page.evaluate(([method, args]) => new Promise((resolve, reject) => {
		(window as any).withFilesystem(() => {
			(window as any).ZenFS.fs[method](...args, (error, result) => error ? reject(error) : resolve(result));
		});
	}), [method, args] as const);
}

async function openControlPanel(page: Page) {
	await openStartMenu(page);
	await page.locator('#start_btn_settings').click();
	await page.locator('#start_btn_control_panel').click();
	const controlPanel = windowTitled(page, 'Control Panel');
	await expect(controlPanel).toBeVisible();
	return controlPanel;
}

async function openApplet(page: Page, name: string) {
	await (await openControlPanel(page)).locator('.settings-icon', { hasText: name }).dblclick();
}

function cssProperty(page: Page, name: string) {
	return page.evaluate((name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim(), name);
}

test('Settings opens the Control Panel and Printers', async ({ page }) => {
	await openDesktop(page);
	await openControlPanel(page);
	await openStartMenu(page);
	await page.locator('#start_btn_settings').hover();
	await page.locator('#start_btn_printers').click(); // (it opens when pointed at)
	await expect(windowTitled(page, 'Printers')).toBeVisible();
	await expect(page.locator('.start-menu')).toBeHidden();
	await expect(page.locator('#start_menu_settings')).toBeHidden();
});

test('what can\'t be changed says access is denied', async ({ page }) => {
	await openDesktop(page);
	await openApplet(page, 'Passwords');
	await expect(windowTitled(page, 'Passwords')).toContainText('Insufficient permissions');
});

test('Display Properties changes the wallpaper, and it stays', async ({ page }) => {
	await openDesktop(page);
	await openApplet(page, 'Display');
	const display = windowTitled(page, 'Display Properties');
	await display.locator('.list-item', { hasText: '20170225_160324' }).dispatchEvent('pointerdown');
	await display.getByText('Center').click();
	await display.getByRole('button', { name: 'OK' }).click();
	const desktop = page.locator('#desktop');
	await expect(desktop).toHaveCSS('background-image', /\/C\/My%20Pictures\/20170225_160324\.jpg/);
	await expect(desktop).toHaveCSS('background-size', 'auto');

	await openDesktop(page);
	await expect(desktop).toHaveCSS('background-image', /20170225_160324\.jpg/);
	await openApplet(page, 'Display');
	await display.locator('.list-item', { hasText: '(None)' }).dispatchEvent('pointerdown');
	await display.getByRole('button', { name: 'OK' }).click();
	await expect(desktop).toHaveCSS('background-image', 'none');
});

test('Display Properties changes the color scheme, of every window', async ({ page }) => {
	await openDesktop(page);
	await page.evaluate(() => (window as any).Notepad());
	await expect(windowTitled(page, 'Untitled - Notepad')).toBeVisible();
	await openApplet(page, 'Display');
	const display = windowTitled(page, 'Display Properties');
	await display.locator('.tab', { hasText: 'Appearance' }).dispatchEvent('pointerdown');
	await display.locator('select').selectOption('Brick');
	await display.getByRole('button', { name: 'OK' }).click();
	expect(await cssProperty(page, '--ButtonFace')).toBe('rgb(194, 191, 165)');
	const notepad = page.frames().find((frame) => frame.url().includes('programs/notepad'))!;
	expect(await notepad.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ButtonFace').trim())).toBe('rgb(194, 191, 165)');
	// (and windows opened afterwards, even the folders shown in Explorer)
	await page.evaluate(() => (window as any).Explorer('/My Documents/'));
	const explorer = page.frameLocator('iframe[src*="programs/explorer"]');
	await expect(explorer.frameLocator('iframe').locator('.desktop-icon').first()).toBeVisible();
	const folder = page.frames().find((frame) => frame.parentFrame()?.url().includes('programs/explorer') && frame.url().startsWith('about:'))!;
	// (the colors come with the folder's load event, which in Firefox can be after the icons show)
	await expect.poll(() => folder.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ButtonFace').trim())).toBe('rgb(194, 191, 165)');

	await openDesktop(page);
	expect(await cssProperty(page, '--ButtonFace')).toBe('rgb(194, 191, 165)');
	await openApplet(page, 'Display');
	await display.locator('.tab', { hasText: 'Appearance' }).dispatchEvent('pointerdown');
	await display.locator('select').selectOption('Windows Standard');
	await display.getByRole('button', { name: 'Apply' }).click();
	expect(await cssProperty(page, '--ButtonFace')).toBe('rgb(192, 192, 192)');
});

test('the screen can look like a CRT monitor\'s, through Shut Down too', async ({ page }) => {
	await openDesktop(page);
	await expect(page.locator('#crt-screen')).toBeHidden();
	await openApplet(page, 'Display');
	const display = windowTitled(page, 'Display Properties');
	await display.locator('.tab', { hasText: 'Effects' }).dispatchEvent('pointerdown');
	await display.getByText('CRT monitor').click();
	await display.getByRole('button', { name: 'OK' }).click();
	await expect(page.locator('#crt-screen')).toBeVisible();

	await page.evaluate(() => document.getElementById('start_btn_shutdown')!.click());
	// (skip the POST screen and boot sequence the next visit would show)
	await page.evaluate(() => { localStorage.setItem('POST', '1'); localStorage.setItem('boot', 'true'); });
	await openDesktop(page);
	await expect(page.locator('#crt-screen')).toBeVisible();
});

test('the CV can be kept from opening at startup', async ({ page }) => {
	await openDesktop(page);
	await openApplet(page, 'System');
	const system = windowTitled(page, 'System Properties');
	await system.locator('.tab', { hasText: 'Startup' }).dispatchEvent('pointerdown');
	await system.getByText('CV (EN).pdf', { exact: true }).click();
	await system.getByRole('button', { name: 'OK' }).click();

	await page.goto('/');
	await page.waitForFunction(() => (window as any).folder_view && typeof (window as any).systemExecuteFile === 'function');
	await page.waitForTimeout(2000);
	await expect(page.locator('iframe[src*="programs/pdfviewer"]')).toHaveCount(0);
});

test('Add/Remove Programs removes a game, and puts it back', async ({ page }) => {
	await openDesktop(page);
	await openApplet(page, 'Add/Remove Programs');
	const addRemove = windowTitled(page, 'Add/Remove Programs Properties');
	await addRemove.locator('.list-item', { hasText: 'Doom' }).dispatchEvent('pointerdown');
	await addRemove.getByRole('button', { name: 'Add/Remove...' }).click();
	await windowTitled(page, 'Confirm Program Removal').getByRole('button', { name: 'Yes' }).click();
	await expect(addRemove.locator('.list-item', { hasText: 'Doom' })).toHaveCount(0);
	await expect(desktopIcon(page, 'Doom')).toHaveCount(0);
	await expect.poll(() => fsCall(page, 'readdir', '/Games')).not.toContain('doom.exe');

	await openDesktop(page);
	await expect(desktopIcon(page, 'Doom')).toHaveCount(0);
	expect(await fsCall(page, 'readdir', '/Games')).not.toContain('doom.exe');
	await openApplet(page, 'Add/Remove Programs');
	await addRemove.getByRole('button', { name: 'Restore Defaults' }).click();
	await windowTitled(page, 'Restore Defaults').getByRole('button', { name: 'Yes' }).click();
	await expect(desktopIcon(page, 'Doom')).toBeVisible();
	await expect.poll(() => fsCall(page, 'readdir', '/Games')).toContain('doom.exe');
	// (the site's own file, back)
	expect(await fsCall(page, 'readFile', '/Games/doom.exe', 'utf8')).toBe('Doom();\n');
});

test('System Properties can restore drive C:', async ({ page }) => {
	await openDesktop(page);
	await writeFile(page, '/My Documents/new.txt', 'new');
	await fsCall(page, 'unlink', '/My Documents/KET.pdf');
	await openApplet(page, 'System');
	const system = windowTitled(page, 'System Properties');
	await system.locator('.tab', { hasText: 'Performance' }).dispatchEvent('pointerdown');
	await system.getByRole('button', { name: 'Restore C: Drive...' }).click();
	await Promise.all([
		page.waitForEvent('load'),
		windowTitled(page, 'Restore C: Drive').getByRole('button', { name: 'Yes' }).click(),
	]);
	await page.waitForFunction(() => (window as any).folder_view && typeof (window as any).systemExecuteFile === 'function');
	const documents = await fsCall(page, 'readdir', '/My Documents');
	expect(documents).toContain('KET.pdf');
	expect(documents).not.toContain('new.txt');
});

test('the Add Printer Wizard can\'t install a printer', async ({ page }) => {
	await openDesktop(page);
	await openApplet(page, 'Printers');
	await windowTitled(page, 'Printers').locator('.settings-icon', { hasText: 'Add Printer' }).dblclick();
	const wizard = windowTitled(page, 'Add Printer Wizard');
	await wizard.getByRole('button', { name: 'Next >' }).click();
	await wizard.getByRole('button', { name: 'Next >' }).click(); // (a local printer)
	await wizard.locator('.list-item', { hasText: /^HP$/ }).dispatchEvent('pointerdown');
	await wizard.locator('.list-item', { hasText: 'HP LaserJet 4L' }).dispatchEvent('pointerdown');
	await wizard.getByRole('button', { name: 'Finish' }).click();
	await expect(windowTitled(page, 'Add Printer Wizard')).toContainText('PC LOAD LETTER', { timeout: 10_000 });
	await expect(windowTitled(page, 'Add Printer Wizard')).toContainText('HP LaserJet 4L');
});
