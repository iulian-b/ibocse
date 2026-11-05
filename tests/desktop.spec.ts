import { test, expect, openDesktop, windowTitled, desktopIcon, openStartMenu, run, skipWithoutWebAudio } from './fixtures';
import type { Page } from '@playwright/test';

test.describe('first boot', () => {
	test.use({ booted: false });

	test('plays the boot sequence once, then shows the desktop', async ({ page }) => {
		await page.goto('/', { waitUntil: 'domcontentloaded' }); // (the boot screen only lasts a few seconds)
		// (Windows 98's, the hard disk's operating system's)
		await expect(page.locator('#bootloader')).toBeVisible();
		await expect(page.locator('#bootloader')).toHaveText('Starting Windows 98...');
		// (and the desktop is nowhere to be seen, or used, until it's done)
		await expect(page.locator('.desktop-icon').first()).toBeHidden();
		await expect(page.locator('.start-button')).toBeHidden();
		await page.keyboard.press('Meta'); // (which opens the Start menu)
		await page.keyboard.press('F3'); // (Find)
		await expect(page.locator('.start-menu')).toBeHidden();
		await expect(page.locator('.find-window')).toHaveCount(0);
		await expect(page.locator('.windows-98-splash img')).toHaveAttribute('src', 'images/os/hdd/bootlogo.png');
		await expect(page.locator('.windows-98-splash')).toContainText('Windows 98');
		await expect(page.locator('#taskbar')).toBeVisible({ timeout: 15_000 });
		await expect(page.locator('#bootloader')).toHaveCount(0);
		await expect(page.locator('html')).not.toHaveClass(/booting/);
		await page.keyboard.press('Meta');
		await expect(page.locator('.start-menu')).toBeVisible();
		await expect.poll(() => page.evaluate(() => localStorage.getItem('boot'))).toBe('true');

		await page.reload();
		await expect(page.locator('#bootloader')).toHaveCount(0);
		await expect(page.locator('#taskbar')).toBeVisible();
		await expect(page.locator('#preloader')).toBeHidden(); // (it used to cover the desktop for good on every visit after the first)
	});
});

test.describe('desktop icons', () => {
	const windows: [icon: string, title: string | RegExp][] = [
		['My Computer', '(C:)'],
		['Recycle Bin', 'Recycle Bin'],
		['My Documents', 'My Documents'],
		['My Music', 'My Music'],
		['My Pictures', 'My Pictures'],
		['Network', 'Network'],
		['Internet Explorer', /google\.com/],
		['Paint', 'untitled - Paint'],
		['Minesweeper', 'Minesweeper'],
		['Sound Recorder', 'Sound - Sound Recorder'],
		['Solitaire', 'Solitaire'],
		['Notepad', 'Untitled - Notepad'],
		['Calculator', 'Calculator'],
		['Terminal', 'MS-DOS Prompt'],
		['VMware 2.0', 'VMware - Windows 98'],
		['Pinball', /Space Cadet$/], // becomes "Wormhole Window - Space Cadet" where the game can't get WebGL
		['Diablo', 'Diablo'],
		['Wolfenstein', 'Wolf 3D'],
		['Tomb Raider', 'Tomb Raider'],
		['Quake III', 'Quake III'],
		['Minecraft', 'Minecraft'],
		['Doom', 'Doom'],
		['Cave Story', 'Cave Story'],
		['Arx Fatalis', 'Arx Fatalis'],
		['Counter Strike 1.6', 'Counter Strike 1.6'],
		['The Elder Scrolls II: Daggerfall', 'The Elder Scrolls II: Daggerfall'],
		['Duke Nukem 3D', 'Duke Nukem 3D'],
		['Wipeout', 'Wipeout'],
		['CV (EN).pdf', 'CV (EN).pdf - PDF Viewer'],
		['CV (RO).pdf', 'CV (RO).pdf - PDF Viewer'],
	];
	for (const [icon, title] of windows) {
		test(`${icon} opens a window`, async ({ page }) => {
			await openDesktop(page);
			if (icon === 'Sound Recorder') {
				await skipWithoutWebAudio(page);
			}
			await desktopIcon(page, icon).dblclick();
			await expect(windowTitled(page, title)).toBeVisible({ timeout: 15_000 });
		});
	}

	test('Winamp opens', async ({ page }) => {
		await openDesktop(page);
		await skipWithoutWebAudio(page);
		await desktopIcon(page, 'Winamp').dblclick();
		await expect(page.locator('#webamp #main-window')).toBeVisible({ timeout: 15_000 });
		await expect(page.locator('.tasks .task .title', { hasText: 'Winamp' })).toBeVisible();
	});

	for (const screensaver of ['3D Pipes', '3D Flower Box']) {
		test(`${screensaver} starts a screensaver`, async ({ page }) => {
			await openDesktop(page);
			await desktopIcon(page, screensaver).dblclick();
			await expect(page.locator('body > iframe')).toBeVisible();
		});
	}

	// (games that can't run in a window here)
	const tabs: [icon: string, url: string][] = [
		['Heroes of Might and Magic II', 'https://midzer.de/wasm/heroes2/'],
		['Need for Speed: Most Wanted', 'https://web.nfsmwo.com/'],
		['Need for Speed: Underground 2', 'https://nfsu2.xyz/'],
		['Grand Theft Auto: Vice City', 'https://gta.rabisco.net/'],
		['Cyberpunk 2077', 'https://cyberpunk2077.lol/'],
	];
	for (const [icon, url] of tabs) {
		test(`${icon} opens in a new tab`, async ({ page, context }) => {
			await openDesktop(page);
			const [tab] = await Promise.all([context.waitForEvent('page'), desktopIcon(page, icon).dblclick()]);
			await expect(tab).toHaveURL(url);
			await expect(page.locator('.os-window')).toHaveCount(0);
		});
	}

	const games_only_in_folder: [title: string, exe: string][] = [
		['Battle City', 'battlecity.exe'],
		['Commander Keen', 'keen.exe'],
		['Prince of Persia', 'prince.exe'],
		['Sonic the Hedgehog', 'sonic.exe'],
		['Super Mario 64', 'mario64.exe'],
	];
	for (const [title, exe] of games_only_in_folder) {
		test(`${title} is in C:\\Games, but not on the desktop`, async ({ page }) => {
			await openDesktop(page);
			await expect(desktopIcon(page, title)).toHaveCount(0);
			await page.evaluate(() => (window as any).Explorer('/Games/'));
			const folder = page.frameLocator('iframe[src*="programs/explorer"]').frameLocator('iframe');
			await folder.locator('.desktop-icon', { hasText: exe }).dblclick();
			await expect(windowTitled(page, title)).toBeVisible({ timeout: 15_000 });
		});
	}
});

test('selecting by dragging past the bottom of the screen doesn\'t scroll the desktop', async ({ page }) => {
	await page.setViewportSize({ width: 800, height: 600 });
	await openDesktop(page);
	// (whatever reaches past the desktop's edge, as an icon's long name can, or the selection box itself, where pixels are fractions)
	await page.evaluate(() => {
		const spill = document.createElement('div');
		spill.style.cssText = 'position: absolute; left: 0; top: 590px; width: 10px; height: 100px';
		document.getElementById('desktop-icons')!.append(spill);
	});
	await page.mouse.move(700, 100);
	await page.mouse.down();
	for (let y = 150; y <= 650; y += 50) {
		await page.mouse.move(690, y); // (past the taskbar, and the bottom of the window)
	}
	for (let i = 0; i < 20; i++) {
		await page.mouse.move(690 - (i % 2), 630);
	}
	await expect(page.locator('#desktop-icons .marquee')).toBeVisible();
	await page.mouse.up();
	expect(await page.locator('#desktop-icons').evaluate((view) => view.scrollTop)).toBe(0);
	await expect(desktopIcon(page, 'My Computer')).toBeInViewport();
});

test('the Recycle Bin on the desktop shows whether there\'s something in it', async ({ page }) => {
	await openDesktop(page);
	const icon = desktopIcon(page, 'Recycle Bin').locator('img');
	await expect(icon).toHaveAttribute('src', /recycle-bin-full-32x32\.png/);
	await page.evaluate(() => new Promise<void>((resolve) => {
		const fs = (window as any).ZenFS.fs;
		fs.readdir('/Recycle Bin', (error, names: string[]) => {
			let left = names.length;
			for (const name of names) {
				fs.unlink(`/Recycle Bin/${name}`, () => --left || resolve());
			}
		});
	}));
	await openDesktop(page);
	await expect(icon).toHaveAttribute('src', /recycle-bin-32x32\.png/);
});

test.describe('Start menu', () => {
	const entries: [id: string, title: string][] = [
		['start_btn_update', 'Windows 98'],
		['start_btn_programs', 'Program Files'],
		['start_btn_favorites', 'Favorites'],
		['start_btn_documents', 'My Documents'],
		['start_btn_run', 'Run'],
	];
	for (const [id, title] of entries) {
		test(`${id} opens "${title}"`, async ({ page }) => {
			await openDesktop(page);
			await openStartMenu(page);
			await page.locator(`#${id}`).click();
			await expect(windowTitled(page, title)).toBeVisible();
		});
	}

	test('Help opens the project page in a new tab', async ({ page, context }) => {
		await openDesktop(page);
		await openStartMenu(page);
		// (the request itself is blocked; other sites are kept out of the tests)
		const request = context.waitForEvent('request', (request) => request.url().startsWith('https://github.com/iulian-b/ibocse'));
		await page.locator('#start_btn_help').click();
		await request;
	});

	test('opens with the Windows key, not Ctrl', async ({ page }) => {
		await openDesktop(page);
		await page.keyboard.press('Control');
		await expect(page.locator('.start-menu')).toBeHidden();
		await page.keyboard.press('Meta');
		await expect(page.locator('.start-menu')).toBeVisible();
	});
});

test.describe('sounds', () => {
	test('the big ones are only downloaded once they play', async ({ page }) => {
		const sounds: string[] = [];
		page.on('request', (request) => {
			if (/\.wav$/i.test(request.url())) {
				sounds.push(new URL(request.url()).pathname);
			}
		});
		await openDesktop(page);
		await page.waitForTimeout(1000);
		expect(sounds.filter((sound) => /LOOP|PANIC|SHUTDOWN/.test(sound))).toEqual([]);
	});

	test('the volume icon mutes them, also after a reload', async ({ page }) => {
		await openDesktop(page);
		const icon = page.locator('#volume-tray-icon');
		await icon.click();
		await expect(icon).toHaveAttribute('src', /audio-nope/);
		expect(await page.evaluate('[loopAudio.muted, shutdownAudio.muted]')).toEqual([true, true]);
		await openDesktop(page);
		await expect(icon).toHaveAttribute('src', /audio-nope/);
		expect(await page.evaluate('loopAudio.muted')).toBe(true);
		await icon.click();
		await expect(icon).toHaveAttribute('src', /audio-okay/);
		expect(await page.evaluate('loopAudio.muted')).toBe(false);
	});
});

test.describe('Run dialog', () => {
	test('runs programs, one after another', async ({ page }) => {
		await openDesktop(page);
		await skipWithoutWebAudio(page);
		await run(page, 'recorder.exe');
		await run(page, 'calc.exe');
		await expect(windowTitled(page, 'Sound - Sound Recorder')).toBeVisible();
		await expect(windowTitled(page, 'Calculator')).toBeVisible();
	});

	test('takes program names in any case, with or without .exe', async ({ page }) => {
		await openDesktop(page);
		await run(page, 'CALC');
		await run(page, 'Notepad.EXE');
		await expect(windowTitled(page, 'Calculator')).toBeVisible();
		await expect(windowTitled(page, 'Untitled - Notepad')).toBeVisible();
	});

	test('says when a program or file doesn\'t exist', async ({ page }) => {
		await openDesktop(page);
		await run(page, 'setup.exe');
		await expect(windowTitled(page, 'setup.exe')).toContainText('Cannot find the file \'setup.exe\'');
		await run(page, '/My Documents/nope.txt');
		await expect(windowTitled(page, 'nope.txt')).toContainText('Cannot find the file \'/My Documents/nope.txt\'');
	});

	test('opens folders', async ({ page }) => {
		await openDesktop(page);
		await run(page, '/My Documents');
		await expect(windowTitled(page, 'My Documents')).toBeVisible();
	});

	test('opens files with their program', async ({ page }) => {
		await openDesktop(page);
		await run(page, '/My Documents/CV (EN).pdf');
		await expect(windowTitled(page, 'CV (EN).pdf - PDF Viewer')).toBeVisible();
	});

	test('Cancel closes without running anything', async ({ page }) => {
		await openDesktop(page);
		await page.evaluate(() => (window as any).openRunDialog());
		const dialog = page.frameLocator('iframe[src*="programs/run"]');
		await dialog.locator('#target').fill('calc.exe');
		await dialog.getByRole('button', { name: 'Cancel' }).click();
		await expect(windowTitled(page, 'Run')).toHaveCount(0);
		await expect(windowTitled(page, 'Calculator')).toHaveCount(0);
	});

	test('digitalis.exe panics the kernel', async ({ page }) => {
		await openDesktop(page);
		await run(page, 'digitalis.exe');
		await expect(page.locator('#kpanic')).toContainText('Kernel panic');
	});
});

test.describe('power', () => {
	test('shutting down goes through the POST screen on the next visit', async ({ page }) => {
		await openDesktop(page);
		await openStartMenu(page);
		await page.locator('#start_btn_shutdown').click();
		await expect(page.locator('#taskbar')).toHaveCount(0);

		await page.goto('/');
		await expect(page).toHaveURL(/\$POST\.html$/);
		await expect(page.locator('#memory_counter')).toContainText('OK', { timeout: 10_000 });
		// then boots again, with the boot sequence, since shutting down clears everything
		await expect(page).toHaveURL(/\/(index\.html)?$/, { timeout: 10_000 });
		await expect(page.locator('#taskbar')).toBeVisible({ timeout: 15_000 });
	});

	test('logging off blanks the screen', async ({ page }) => {
		await openDesktop(page);
		await openStartMenu(page);
		await page.locator('#start_btn_logoff').click();
		await expect(page.locator('#taskbar')).toHaveCount(0);
	});

	test('logging off stops Winamp', async ({ page }) => {
		test.slow(); // (as in programs.spec.ts, Winamp can take a while to load)
		await openDesktop(page);
		await skipWithoutWebAudio(page);
		await page.evaluate(() => (window as any).systemExecuteFile('/My Music/blue.mp3'));
		await expect(page.locator('.tasks .task .title', { hasText: /^1\. blue - Winamp/ })).toBeVisible({ timeout: 30_000 });
		await openStartMenu(page);
		await page.locator('#start_btn_logoff').click();
		await expect(page.locator('#taskbar')).toHaveCount(0);
		expect(await page.evaluate('webamp')).toBeNull();
	});

	test('the BIOS setup can be left with Esc', async ({ page }) => {
		await page.goto('/$POST.html');
		await page.keyboard.press('Delete');
		// (after the memory test, as a real POST does)
		await expect(page.locator('#post_message')).toHaveText('Entering SETUP...');
		await expect(page.locator('#memory_counter')).not.toContainText('OK');
		await expect(page).toHaveURL(/BIOS\/PASSWORD\.html$/, { timeout: 15_000 });
		const password = page.locator('#biosPassword');
		await password.fill('hunter2');
		await password.press('Enter');
		await expect(page).toHaveURL(/BIOS\/PASSWORD\.html$/);
		await expect(password).toHaveValue('');
		await page.keyboard.press('Escape');
		await expect(page).toHaveURL(/\$POST\.html$/);
	});

	test('the BIOS setup\'s password is 1998, and opens the CMOS Setup Utility', async ({ page }) => {
		await page.goto('/BIOS/PASSWORD.html');
		const password = page.locator('#biosPassword');
		// (the placeholder isn't the color of the box)
		expect(await password.evaluate((input) => getComputedStyle(input, '::placeholder').color)).toBe('rgb(85, 85, 85)');
		await password.fill('1998');
		await password.press('Enter');
		await expect(page.locator('#password_jumbotron')).toBeHidden(); // (a moment's blank screen)
		await expect(page).toHaveURL(/BIOS\/SETUP\.html$/);
		await expect(page.locator('#bios')).toContainText('CMOS Setup Utility');
		await expect(page.locator('.bios-menu-item.selected')).toHaveText('►Standard CMOS Features');
	});

	test('the CMOS Setup Utility can\'t be opened without the password', async ({ page }) => {
		await page.goto('/BIOS/SETUP.html');
		await expect(page).toHaveURL(/BIOS\/PASSWORD\.html$/);
	});

	test('what\'s saved in the BIOS shows on the POST screen', async ({ page }) => {
		await page.goto('/BIOS/PASSWORD.html');
		await page.locator('#biosPassword').fill('1998');
		await page.locator('#biosPassword').press('Enter');
		await expect(page.locator('#bios')).toContainText('Frequency/Voltage Control');
		for (let i = 0; i < 6; i++) {
			await page.keyboard.press('ArrowDown');
		}
		await page.keyboard.press('Enter');
		await expect(page.locator('.bios-subtitle')).toHaveText('Frequency/Voltage Control');
		await expect(page.locator('.bios-item.selected')).toContainText('CPU Clock Ratio');
		for (let i = 0; i < 6; i++) {
			await page.keyboard.press('PageUp'); // (Auto, 40X, ... 45X)
		}
		await expect(page.locator('.bios-item.selected .bios-value')).toHaveText('[45X]');
		await expect(page.locator('#bios')).toContainText('4.50GHz');
		await page.keyboard.press('F10');
		await expect(page.locator('.bios-dialog')).toContainText('SAVE to CMOS and EXIT');
		await page.keyboard.press('Enter');
		await expect(page).toHaveURL(/\$POST\.html$/);
		await expect(page.locator('#cpu_frequency')).toHaveText('4.50');
	});

	test('the CMOS Setup Utility can be used by clicking', async ({ page }) => {
		await page.goto('/BIOS/PASSWORD.html');
		await page.locator('#biosPassword').fill('1998');
		await page.locator('#biosPassword').press('Enter');
		// (click to select, and click again to open)
		const item = page.locator('.bios-menu-item', { hasText: 'Advanced BIOS Features' });
		await item.click();
		await item.click();
		await expect(page.locator('.bios-subtitle')).toHaveText('Advanced BIOS Features');
		const quickBoot = page.locator('.bios-item', { hasText: 'Quick Boot' });
		await quickBoot.click();
		await quickBoot.click();
		await page.locator('.bios-option', { hasText: 'Disabled' }).click();
		await expect(quickBoot).toContainText('[Disabled]');
		await page.locator('.bios-key', { hasText: 'ESC:Exit' }).click();
		const exit = page.locator('.bios-menu-item', { hasText: 'Exit Without Saving' });
		await exit.click();
		await exit.click();
		await page.locator('.bios-answer', { hasText: 'Y' }).click();
		await expect(page).toHaveURL(/\$POST\.html$/);
		expect(await page.evaluate(() => localStorage.getItem('bios-settings'))).toBeNull();
	});
});

test.describe('boot menu', () => {
	const buttonFace = (page) => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ButtonFace').trim());

	/** Waits for the boot sequence (which the boot menu shows) to end, as it does, with the CV, and closes it. */
	async function finishBooting(page: Page) {
		await expect.poll(() => page.evaluate(() => localStorage.getItem('boot')), { timeout: 25_000 }).toBe('true');
		const cv = page.locator('iframe[src*="programs/pdfviewer"]');
		await cv.waitFor({ state: 'attached' });
		await cv.evaluate((iframe: any) => iframe.$window.close());
	}

	test('opens with F11, and is used with the arrow keys', async ({ page }) => {
		await page.goto('/$POST.html');
		await expect(page.locator('#text-bottom')).toContainText('F11:Boot Menu');
		await page.keyboard.press('F11');
		await expect(page.locator('#post_message')).toHaveText('Entering Boot Menu...');
		await expect(page).toHaveURL(/BIOS\/BOOTMENU\.html$/, { timeout: 15_000 });
		await expect(page.locator('.boot-device')).toHaveText(['HDD:Lexar LNM620X256G-RNNNG', 'Network:IBA GE Slot 0600 v1242', 'USB:Virtual FDD', 'USB:Virtual DVD/CD-ROM']);
		const selected = page.locator('.boot-device.selected');
		await expect(selected).toHaveText(/^HDD/);
		for (let i = 0; i < 4; i++) {
			await page.keyboard.press('ArrowDown');
		}
		await expect(selected).toHaveText('USB:Virtual DVD/CD-ROM');
		await page.keyboard.press('ArrowUp');
		await expect(selected).toHaveText('USB:Virtual FDD');
		// (there's nothing to boot on the USB drives, so the computer restarts, once Enter is pressed)
		await page.keyboard.press('Enter');
		await expect(page.locator('.boot-screen')).toHaveText('DISK BOOT FAILURE, INSERT SYSTEM DISK AND PRESS ENTER');
		await page.keyboard.press('ArrowUp'); // (not the menu any more)
		await page.waitForTimeout(500);
		await expect(page).toHaveURL(/BOOTMENU\.html$/);
		await page.keyboard.press('Enter');
		await expect(page).toHaveURL(/\$POST\.html$/);

		// Esc boots the hard disk
		await page.goto('/BIOS/BOOTMENU.html');
		await page.keyboard.press('Escape');
		await expect(page.locator('.boot-screen')).toContainText('Verifying DMI Pool Data');
		await expect(page).toHaveURL(/index\.html$/, { timeout: 15_000 });
		await expect(page.locator('#bootloader')).toHaveText('Starting Windows 98...');
		await expect(page.locator('#taskbar')).toBeVisible({ timeout: 15_000 });
		await expect(page.locator('.start-button img')).toHaveAttribute('src', 'images/os/hdd/start.png');
		// (Windows' logo, not Sinclair's: in the Start menu, and as the tab's icon)
		await expect(page.locator('#start_btn_update img')).toHaveAttribute('src', '/images/icons/windows-32x32-8bpp.png');
		await expect(page.locator('.start-menu-titlebar')).toHaveCSS('background-color', 'rgb(0, 0, 128)'); // (Windows 98's navy sidebar)
		expect(await page.locator('link[rel~="icon"]').evaluateAll((links) => links.map((link) => link.getAttribute('href')))).toEqual(['/images/icons/windows-32x32-8bpp.png', '/images/icons/windows-32x32-8bpp.png', '/images/icons/windows-32x32-8bpp.png']);
		await expect(page.locator('#buildtext')).toHaveText('Windows 98 Build 4.10.1998For testing purposes only.');
		expect(await buttonFace(page)).toBe('rgb(192, 192, 192)');
		await page.evaluate(() => (window as any).openRunDialog());
		await expect(page.frameLocator('iframe[src*="programs/run"]').locator('.runtext')).toContainText('and Windows will open it for you');
	});

	test('the network boots the other operating system, with its own look and settings', async ({ page }) => {
		test.slow(); // (it boots twice)
		await page.goto('/BIOS/BOOTMENU.html');
		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('Enter');
		// (the network card's boot agent gets an address first)
		const bootScreen = page.locator('.boot-screen');
		await expect(bootScreen).toContainText('Intel(R) Boot Agent GE v1.2.42');
		await expect(bootScreen).toContainText(/DHCP\.[|/\-\\]/);
		await expect(bootScreen).toContainText('CLIENT IP: 10.6.0.32');
		await expect(page).toHaveURL(/index\.html$/, { timeout: 15_000 });
		// (Sinclair OS's own boot)
		await expect(page.locator('#bootloader img')).toHaveAttribute('src', 'images/os/network/bootlogo.png');
		await expect(page.locator('#bootloader')).toContainText('Starting version 9.0.8f-sinclaire');
		await expect(page.locator('#bootloader')).toContainText('Welcome to Sinclaire OS!');
		await expect(page.locator('#bootloader')).toContainText('Load Kernel Module configfs...'); // (a part that used to be skipped)
		await expect(page.locator('#bootloader')).toContainText('Starting Desktop Environment...');
		// (its parts appear one after another, "Starting Desktop Environment..." last)
		const delays = await page.locator('#bootloader > .fade').evaluateAll((parts) => parts.map((part) => parseFloat(getComputedStyle(part).animationDelay)));
		expect(delays.length).toBeGreaterThan(10);
		expect(delays.every((delay, index) => index === 0 || delay > delays[index - 1])).toBe(true);
		await finishBooting(page);
		expect(await buttonFace(page)).toBe('rgb(104, 120, 104)');
		await expect(page.locator('#desktop')).toHaveCSS('background-image', /images\/os\/network\/wallpaper\.jpg/);
		await expect(page.locator('.start-button img')).toHaveAttribute('src', 'images/os/network/start.png');
		await expect(page.locator('#start_btn_update img')).toHaveAttribute('src', '/images/icons/sinclair-updates-32x32.png');
		await expect(page.locator('link[rel="icon"][sizes="32x32"]')).toHaveAttribute('href', '/favicon-32x32.png'); // (the site's own)
		await expect(page.locator('#buildtext')).toHaveText('Sinclair OS-9 build 9.0.8f (x64)Not for commercial use.');
		await expect(page.locator('.start-menu-titlebar')).toHaveCSS('background-image', /images\/os\/network\/start-menu-side\.png/);
		// (its windows too)
		await page.evaluate(() => (window as any).Notepad());
		await expect(windowTitled(page, 'Untitled - Notepad')).toBeVisible();
		const notepad = page.frames().find((frame) => frame.url().includes('programs/notepad'))!;
		await expect.poll(() => notepad.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ButtonFace').trim())).toBe('rgb(104, 120, 104)');
		await page.evaluate(() => (window as any).SystemProperties());
		const systemInfo = windowTitled(page, 'System Properties').locator('.system-info');
		await expect(systemInfo).toContainText('Sinclair OS-9');
		await expect(systemInfo).toContainText('9.0.8f (x64)');

		// Its own color scheme is the one it starts with, and what's chosen is its own
		await page.evaluate(() => (window as any).DisplayProperties());
		const display = windowTitled(page, 'Display Properties');
		await display.locator('.tab', { hasText: 'Appearance' }).dispatchEvent('pointerdown');
		await expect(display.locator('select')).toHaveValue('Sinclair Green');
		await display.locator('select').selectOption('Brick');
		await display.getByRole('button', { name: 'OK' }).click();
		expect(await page.evaluate(() => JSON.parse(localStorage.getItem('network-settings')!).color_scheme)).toBe('Brick');
		expect(await page.evaluate(() => localStorage.getItem('settings'))).toBeNull();

		// Its name, in About, its message boxes, and Run
		await page.evaluate('update_dialog()');
		await expect(windowTitled(page, 'Sinclair OS-9').locator('.window-content img')).toHaveAttribute('src', 'images/os/network/banner.png');
		await page.evaluate('void showMessageBox({ message: "Hello" })'); // (not waiting for it to be closed)
		await expect(windowTitled(page, /^Sinclair$/)).toContainText('Hello');
		await page.evaluate(() => (window as any).openRunDialog());
		await expect(page.frameLocator('iframe[src*="programs/run"]').locator('.runtext')).toContainText('and Sinclair will open it for you');

		// A normal boot is the hard disk's again, as it was
		await page.goto('/$POST.html');
		await expect(page).toHaveURL(/index\.html$/, { timeout: 15_000 });
		await page.waitForFunction(() => (window as any).DisplayProperties);
		expect(await page.evaluate(() => localStorage.getItem('boot-device'))).toBeNull();
		expect(await buttonFace(page)).toBe('rgb(192, 192, 192)');
		await expect(page.locator('#desktop')).toHaveCSS('background-image', /images\/os\/hdd\/wallpaper\.jpeg/);
		await page.evaluate(() => (window as any).DisplayProperties());
		await display.locator('.tab', { hasText: 'Appearance' }).dispatchEvent('pointerdown');
		await expect(display.locator('select')).toHaveValue('Windows Standard');
		await expect(display.locator('option', { hasText: 'Sinclair Green' })).toHaveCount(0);
		await page.evaluate(() => (window as any).SystemProperties());
		await expect(systemInfo).toContainText('Microsoft Windows 98');
		await expect(systemInfo).toContainText('4.10.1998');
		await expect(systemInfo).not.toContainText('Sinclair');
	});

	test('Shut Down forgets the network boot, but not the settings', async ({ page }) => {
		await page.goto('/BIOS/BOOTMENU.html');
		await page.locator('.boot-device', { hasText: 'Network' }).click();
		await finishBooting(page);
		await page.evaluate(() => localStorage.setItem('network-settings', JSON.stringify({ crt_monitor: true })));
		await openStartMenu(page);
		await page.locator('#start_btn_shutdown').click();
		expect(await page.evaluate(() => localStorage.getItem('boot-device'))).toBeNull();
		expect(await page.evaluate(() => localStorage.getItem('network-settings'))).toBe('{"crt_monitor":true}');
	});
});
