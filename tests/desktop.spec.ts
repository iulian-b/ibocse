import { test, expect, openDesktop, windowTitled, desktopIcon, openStartMenu, run, skipWithoutWebAudio } from './fixtures';

test.describe('first boot', () => {
	test.use({ booted: false });

	test('plays the boot sequence once, then shows the desktop', async ({ page }) => {
		await page.goto('/', { waitUntil: 'domcontentloaded' }); // (the boot screen only lasts a few seconds)
		await expect(page.locator('#bootloader')).toBeVisible();
		await expect(page.locator('#bootloader')).toContainText('Load Kernel Module configfs...'); // (a part that used to be skipped)
		await expect(page.locator('#bootloader')).toContainText('Starting Desktop Environment...');
		await expect(page.locator('#taskbar')).toBeVisible({ timeout: 15_000 });
		await expect(page.locator('#bootloader')).toHaveCount(0);
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
		['VMware 2.0', 'VMware - Sinclair OS-9'],
		['Pinball', /Space Cadet$/], // becomes "Wormhole Window - Space Cadet" where the game can't get WebGL
		['Diablo', 'Diablo'],
		['Wolfenstein', 'Wolf 3D'],
		['Tomb Raider', 'Tomb Raider'],
		['Quake III', 'Quake III'],
		['Minecraft', 'Minecraft'],
		['Commander Keen', 'Commander Keen'],
		['Doom', 'Doom'],
		['Cave Story', 'Cave Story'],
		['Arx Fatalis', 'Arx Fatalis'],
		['Counter Strike 1.6', 'Counter Strike 1.6'],
		['The Elder Scrolls II: Daggerfall', 'The Elder Scrolls II: Daggerfall'],
		['Duke Nukem 3D', 'Duke Nukem 3D'],
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

	test('Battle City is in C:\\Games, but not on the desktop', async ({ page }) => {
		await openDesktop(page);
		await expect(desktopIcon(page, 'Battle City')).toHaveCount(0);
		await page.evaluate(() => (window as any).Explorer('/Games/'));
		const folder = page.frameLocator('iframe[src*="programs/explorer"]').frameLocator('iframe');
		await folder.locator('.desktop-icon', { hasText: 'battlecity.exe' }).dblclick();
		await expect(windowTitled(page, 'Battle City')).toBeVisible({ timeout: 15_000 });
	});
});

test.describe('Start menu', () => {
	const entries: [id: string, title: string][] = [
		['start_btn_update', 'Sinclair OS-9'],
		['start_btn_programs', 'Program Files'],
		['start_btn_favorites', 'Favorites'],
		['start_btn_documents', 'My Documents'],
		['start_btn_settings', 'Error'],
		['start_btn_find', 'Error'],
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
		const request = context.waitForEvent('request', (request) => request.url().startsWith('https://github.com/iulian-b/ccc-crlab2-h032'));
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
		await expect(page.locator('#memory_counter')).toContainText('OK');
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
		await openDesktop(page);
		await skipWithoutWebAudio(page);
		await page.evaluate(() => (window as any).systemExecuteFile('/My Music/blue.mp3'));
		await expect(page.locator('.tasks .task .title', { hasText: /^1\. blue - Winamp/ })).toBeVisible({ timeout: 15_000 });
		await openStartMenu(page);
		await page.locator('#start_btn_logoff').click();
		await expect(page.locator('#taskbar')).toHaveCount(0);
		expect(await page.evaluate('webamp')).toBeNull();
	});

	test('the BIOS setup can be left with Esc', async ({ page }) => {
		await page.goto('/$POST.html');
		await page.keyboard.press('Delete');
		await expect(page).toHaveURL(/BIOS\/SETUP\.html$/);
		const password = page.locator('#biosPassword');
		await password.fill('hunter2');
		await password.press('Enter');
		await expect(page).toHaveURL(/BIOS\/SETUP\.html$/);
		await expect(password).toHaveValue('');
		await page.keyboard.press('Escape');
		await expect(page).toHaveURL(/\$POST\.html$/);
	});
});
