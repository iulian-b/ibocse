import { test, expect, openDesktop, windowTitled, desktopIcon } from './fixtures';
import * as fs from 'fs';
import * as path from 'path';
import type { Frame, Page } from '@playwright/test';

// C:\Desktop\Projects: links to websites, an archive no password opens, and folders with projects from GitHub in them,
// which GitHub's API lists and raw.githubusercontent.com has the files of (src/github-folders.js)

/** Calls a ZenFS fs function (callback style) in a page or frame: its result, or its error's code. */
function fsCall(target: Page | Frame, method: string, ...args: unknown[]) {
	return target.evaluate(([method, args]) => new Promise((resolve) => {
		(window as any).withFilesystem(() => {
			(window as any).ZenFS.fs[method](...args, (error, result) => resolve(error ? { code: error.code } : result));
		});
	}), [method, args] as const);
}

const lastPushed = 'Sat, 31 Jan 2026 18:31:51 GMT';
// (a 1x1 picture)
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

/**
 * GitHub, with these repositories' files ({ "iulian-b/fox-conky": { "README.md": "..." } }), or failing; its listing of a whole
 * repository can be made to take a while (wholeDelay, in ms), as a big one's does. The requests made of its API.
 */
async function fakeGitHub(page: Page, repositories: Record<string, Record<string, string | Buffer>>, { failing = false, wholeDelay = 0 } = {}) {
	const listed: string[] = [];
	const cors = { 'Access-Control-Allow-Origin': '*' };
	await page.route('https://api.github.com/**', async (route) => {
		const url = new URL(route.request().url());
		listed.push(url.pathname + url.search);
		const [, repository] = url.pathname.match(/^\/repos\/([^/]+\/[^/]+)\/git\/trees\/HEAD$/) ?? [];
		const files = repositories[repository];
		if (failing || !files) {
			return route.fulfill({ status: 403, headers: cors, json: { message: 'API rate limit exceeded' } });
		}
		const folders = new Set(Object.keys(files).flatMap((file) => file.split('/').slice(0, -1).map((_, i, parts) => parts.slice(0, i + 1).join('/'))));
		const tree = [
			...[...folders].map((folder) => ({ path: folder, mode: '040000', type: 'tree' })),
			...Object.entries(files).map(([file, content]) => ({ path: file, mode: '100644', type: 'blob', size: Buffer.byteLength(content) })),
		].sort((a, b) => (a.path < b.path ? -1 : 1)); // (as git orders them)
		const whole = url.searchParams.get('recursive') === '1';
		if (whole) {
			await new Promise((resolve) => setTimeout(resolve, wholeDelay));
		}
		// (without ?recursive=1, only what's in its top folder)
		return route.fulfill({ headers: { ...cors, 'Last-Modified': lastPushed }, json: { sha: 'f00', tree: whole ? tree : tree.filter(({ path }) => !path.includes('/')), truncated: false } });
	});
	await page.route('https://raw.githubusercontent.com/**', (route) => {
		const [, repository, file] = decodeURIComponent(new URL(route.request().url()).pathname).match(/^\/([^/]+\/[^/]+)\/HEAD\/(.+)$/) ?? [];
		const content = repositories[repository]?.[file];
		return content === undefined || failing
			? route.fulfill({ status: 404, headers: cors, body: '404: Not Found' })
			: route.fulfill({ headers: cors, body: Buffer.from(content) });
	});
	return listed;
}

const foxConky = {
	'iulian-b/fox-conky': {
		'README.md': '# fox-conky\n\n![logo](assets/logo.png)\n\nSee [the configuration](config.conf).\n',
		'assets/logo.png': png,
		'config.conf': 'conky.config = {}\n',
		'LICENSE': 'MIT License\n',
	},
};

test('Projects is on the desktop, with the websites, the archive and the GitHub folders', async ({ page, context }) => {
	await openDesktop(page);
	await expect(desktopIcon(page, 'Projects')).toBeVisible();
	expect(((await fsCall(page, 'readdir', '/Desktop/Projects')) as string[]).sort()).toEqual([
		'caverna', 'EuropaEmpire.zip', 'fox-bspwm', 'fox-conky', 'fox-dots', 'ibocse', 'IndarTech.url', 'ISO-Certificazioni.url',
		'NFTB.url', 'old-homepage-v2', 'puzzlecraft-android15', 'sqlcipher_win64', 'stegosaurus',
	].sort());
	// (nothing asked of GitHub until a GitHub folder is looked in)
	const listed = await fakeGitHub(page, {});

	// The links open their websites in a new tab
	for (const [file, url] of [['IndarTech.url', 'https://www.indartech.ro/'], ['ISO-Certificazioni.url', 'https://www.iso-certificazioni.it/'], ['NFTB.url', 'https://www.ntfb.ro/']]) {
		const tab = context.waitForEvent('page');
		await page.evaluate((file) => (window as any).systemExecuteFile(file), `/Desktop/Projects/${file}`);
		await expect.poll(async () => (await tab).url()).toBe(url);
		await (await tab).close();
	}
	expect(listed).toEqual([]);
	// (and each GitHub folder's shortcut, its repository's page)
	const tab = context.waitForEvent('page');
	await page.evaluate(() => (window as any).systemExecuteFile('/Desktop/Projects/sqlcipher_win64/GitHub.url'));
	await expect.poll(async () => (await tab).url()).toBe('https://github.com/iulian-b/caverna-pysqlcipher');
});

test("each of the projects has its own icon: the websites', and the GitHub folders' (src/FolderView.js)", async ({ page }) => {
	await openDesktop(page);
	const icons = {
		'IndarTech.url': 'indartech',
		'ISO-Certificazioni.url': 'iso-certificazioni',
		'NFTB.url': 'ntfb',
		'EuropaEmpire.zip': 'zip',
		'caverna': 'key-padlock',
		'fox-bspwm': 'bspwm',
		'fox-conky': 'conky',
		'fox-dots': 'niri',
		'ibocse': 'ibocse',
		'old-homepage-v2': 'homepage',
		'puzzlecraft-android15': 'puzzlecraft',
		'sqlcipher_win64': 'file-gears',
		'stegosaurus': 'stegosaurus',
	};
	await page.evaluate(() => (window as any).Explorer('/Desktop/Projects'));
	const folder = page.frameLocator('iframe[src*="programs/explorer"]').frameLocator('iframe');
	for (const [name, icon] of Object.entries(icons)) {
		const picture = folder.locator('.desktop-icon', { hasText: name }).locator('img').first();
		await expect(picture, name).toHaveAttribute('src', `/images/icons/${icon}-32x32.png`);
		await expect.poll(() => picture.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth), name).toBe(32);
		// (and small, as in Find's results and the List view)
		expect((await page.request.get(`/images/icons/${icon}-16x16.png`)).ok(), `${icon}-16x16.png`).toBe(true);
	}
	// (the GitHub folders' shortcuts are Internet Explorer's, as other web links are)
	expect(await page.evaluate(() => (window as any).icon_id_for_file('/Desktop/Projects/caverna/GitHub.url', false))).toBe('html');
});

test('the archive asks for its password, and no password opens it', async ({ page }) => {
	// (really encrypted, so it's the same anywhere: its file's flags say so)
	const zip = fs.readFileSync(path.resolve(__dirname, '../C/Desktop/Projects/EuropaEmpire.zip'));
	expect(zip.readUInt32LE(0)).toBe(0x04034b50);
	expect(zip.readUInt16LE(6) & 1).toBe(1);

	await openDesktop(page);
	await page.evaluate(() => (window as any).systemExecuteFile('/Desktop/Projects/EuropaEmpire.zip'));
	const dialog = windowTitled(page, 'Enter password');
	await expect(dialog).toContainText('Enter password for the encrypted file EuropaEmpire in archive EuropaEmpire.zip');
	const password = dialog.locator('input[type="password"]');
	await expect(password).toBeFocused();
	for (const attempt of ['europa', 'password123', '']) {
		await password.fill(attempt);
		await password.press('Enter');
		const error = windowTitled(page, 'EuropaEmpire.zip');
		await expect(error).toContainText('The specified password is incorrect.');
		await error.getByRole('button', { name: 'OK' }).click();
		await expect(password).toBeFocused();
	}
	await dialog.getByRole('button', { name: 'Cancel' }).click();
	await expect(dialog).toHaveCount(0);
});

test("a zip archive that isn't encrypted has no program to open it", async ({ page }) => {
	await openDesktop(page);
	// (an empty one: just its end)
	await page.evaluate(() => new Promise<void>((resolve, reject) => {
		const empty = new Uint8Array(22);
		new DataView(empty.buffer).setUint32(0, 0x06054b50, true);
		(window as any).ZenFS.fs.writeFile('/My Documents/empty.zip', empty, (error) => error ? reject(error) : resolve());
	}));
	await page.evaluate(() => (window as any).systemExecuteFile('/My Documents/empty.zip'));
	await expect(windowTitled(page, /^Windows$/)).toContainText('No program is associated with zip files'); // (alert, src/msgbox.js)
	await expect(windowTitled(page, 'Enter password')).toHaveCount(0);
});

test('a GitHub folder has its repository, as GitHub has it, in every window, and none of it can be changed', async ({ page }) => {
	await openDesktop(page);
	const listed = await fakeGitHub(page, foxConky);
	const folder = '/Desktop/Projects/fox-conky';
	const contents = ['GitHub.url', 'LICENSE', 'README.md', 'assets', 'config.conf'];
	expect(((await fsCall(page, 'readdir', folder)) as string[]).sort()).toEqual(contents);
	expect(await fsCall(page, 'readdir', `${folder}/assets`)).toEqual(['logo.png']);
	const stats = await page.evaluate((file) => new Promise<any>((resolve) => {
		(window as any).ZenFS.fs.stat(file, (error, stats) => resolve({ size: stats.size, mtimeMs: stats.mtimeMs, file: stats.isFile() }));
	}), `${folder}/config.conf`);
	expect(stats).toEqual({ size: 18, mtimeMs: Date.parse(lastPushed), file: true });
	expect(await fsCall(page, 'readFile', `${folder}/config.conf`, 'utf8')).toBe('conky.config = {}\n');
	expect(await fsCall(page, 'stat', `${folder}/nothing.txt`)).toEqual({ code: 'ENOENT' });

	// (programs' windows see it through the desktop)
	await page.evaluate((folder) => (window as any).Explorer(folder), folder);
	const explorerFolder = page.frameLocator('iframe[src*="programs/explorer"]').frameLocator('iframe');
	await expect(explorerFolder.locator('.desktop-icon', { hasText: 'README.md' })).toBeVisible();
	await expect(explorerFolder.locator('.desktop-icon', { hasText: 'GitHub.url' })).toBeVisible();
	const explorer = page.frames().find((frame) => frame.url().includes('programs/explorer'))!;
	expect(await fsCall(explorer, 'readFile', `${folder}/LICENSE`, 'utf8')).toBe('MIT License\n');

	// Its README, with its picture from GitHub, and its links to GitHub's pages
	await page.evaluate((file) => (window as any).systemExecuteFile(file), `${folder}/README.md`);
	const markdown = page.frameLocator('iframe[src*="programs/mdview"]').locator('#document');
	await expect(markdown.locator('h1')).toHaveText('fox-conky');
	await expect.poll(() => markdown.locator('img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth)).toBe(1);
	await expect(markdown.locator('img')).toHaveAttribute('src', /^blob:/);
	await expect(markdown.getByRole('link', { name: 'the configuration' })).toHaveAttribute('href', 'https://github.com/iulian-b/fox-conky/blob/HEAD/config.conf');

	// Read-only, and it stays where it is
	expect(await fsCall(page, 'writeFile', `${folder}/config.conf`, 'mine')).toEqual({ code: 'EACCES' });
	expect(await fsCall(page, 'writeFile', `${folder}/new.txt`, 'mine')).toEqual({ code: 'EACCES' });
	expect(await fsCall(page, 'unlink', `${folder}/LICENSE`)).toEqual({ code: 'EACCES' });
	expect(await fsCall(page, 'unlink', `${folder}/GitHub.url`)).toEqual({ code: 'EACCES' });
	expect(await fsCall(page, 'mkdir', `${folder}/assets/more`, 0o777)).toEqual({ code: 'EACCES' }); // (ZenFS's mkdir needs its mode before its callback)
	expect(await fsCall(page, 'rm', folder, { recursive: true })).toEqual({ code: 'EACCES' });
	expect(await fsCall(page, 'rename', folder, '/Desktop/Projects/conky')).toEqual({ code: 'EACCES' });
	expect(await fsCall(page, 'rename', '/Desktop/Projects', '/Desktop/Old Projects')).toEqual({ code: 'EACCES' });
	expect(await fsCall(explorer, 'writeFile', `${folder}/README.md`, 'mine')).toEqual({ code: 'EACCES' });
	expect(((await fsCall(page, 'readdir', folder)) as string[]).sort()).toEqual(contents);
	// (listed by GitHub's API once: its top folder, quickly, and the whole of it)
	expect(listed.sort()).toEqual(['/repos/iulian-b/fox-conky/git/trees/HEAD', '/repos/iulian-b/fox-conky/git/trees/HEAD?recursive=1']);
});

test("a GitHub folder opens without waiting for its whole repository's listing", async ({ page }) => {
	await openDesktop(page);
	await fakeGitHub(page, foxConky, { wholeDelay: 4000 });
	const folder = '/Desktop/Projects/fox-conky';
	const timed = (method: string, ...args: unknown[]) => page.evaluate(async ([method, args]) => {
		const start = performance.now();
		const result = await (window as any).ZenFS.fs.promises[method](...args);
		return { ms: performance.now() - start, result: method === 'stat' ? result.isDirectory() : result };
	}, [method, args] as const);
	// Its top folder, from the quick listing
	const top = await timed('readdir', folder);
	expect(top.ms).toBeLessThan(2000);
	expect([...top.result].sort()).toEqual(['GitHub.url', 'LICENSE', 'README.md', 'assets', 'config.conf']);
	expect((await timed('stat', `${folder}/assets`)).result).toBe(true);
	// What's in its folders, once the whole repository is listed
	expect((await timed('readdir', `${folder}/assets`)).result).toEqual(['logo.png']);
});

test("Explorer leaves room above the icons, and points out when it's reading a folder", async ({ page }) => {
	await openDesktop(page);
	await page.evaluate(() => (window as any).Explorer('/Desktop/Projects'));
	const view = page.frameLocator('iframe[src*="programs/explorer"]').frameLocator('iframe').locator('.folder-view');
	await expect(view.locator('.desktop-icon').first()).toBeVisible();
	await expect(view).not.toHaveClass(/reading/);
	const tops = await view.locator('.desktop-icon').evaluateAll((icons) => icons.map((icon) => parseFloat((icon as HTMLElement).style.top)));
	expect(Math.min(...tops)).toBe(4);
	// (and while Projects is open, the browser is told to get a connection to GitHub's API ready, for opening one of them)
	expect(await page.locator('link[rel="preconnect"][href="https://api.github.com"]').count()).toBe(1);
});

test("a GitHub folder still has its shortcut when GitHub can't be reached", async ({ page }) => {
	await openDesktop(page);
	await fakeGitHub(page, foxConky, { failing: true });
	expect(await fsCall(page, 'readdir', '/Desktop/Projects/fox-conky')).toEqual(['GitHub.url']);
	expect(await fsCall(page, 'stat', '/Desktop/Projects/fox-conky/README.md')).toEqual({ code: 'ENOENT' });
});

test('Find only looks in a GitHub folder when told to', async ({ page }) => {
	await openDesktop(page);
	const listed = await fakeGitHub(page, foxConky);
	const walk = (folder: string) => page.evaluate((folder) => {
		const found: string[] = [];
		return (window as any).walk_drive(folder, true, ({ path }) => found.push(path), () => false).then(() => found);
	}, folder);
	const everywhere = await walk('/Desktop');
	expect(everywhere).toContain('/Desktop/Projects/fox-conky');
	expect(everywhere).not.toContain('/Desktop/Projects/fox-conky/README.md');
	expect(listed).toEqual([]);
	expect(await walk('/Desktop/Projects/fox-conky')).toEqual(expect.arrayContaining(['/Desktop/Projects/fox-conky/README.md', '/Desktop/Projects/fox-conky/assets/logo.png']));
});

test("the network's operating system has no Projects", async ({ page }) => {
	await page.addInitScript(() => localStorage.setItem('boot-device', 'network'));
	await openDesktop(page);
	const listed = await fakeGitHub(page, foxConky);
	await expect(desktopIcon(page, 'Projects')).toHaveCount(0);
	expect(await fsCall(page, 'readdir', '/Desktop')).not.toContain('Projects');
	expect(await fsCall(page, 'readdir', '/Desktop/Projects/fox-conky')).toEqual({ code: 'ENOENT' });
	expect(listed).toEqual([]);
});
