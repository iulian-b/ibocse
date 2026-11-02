import { test, expect, openDesktop, desktopIcon } from './fixtures';

test.beforeEach(async ({ page }) => {
	await openDesktop(page);
	await desktopIcon(page, '3D Pipes').dblclick();
});

test('covers the screen', async ({ page }) => {
	const screensaver = page.locator('body > iframe');
	await expect(screensaver).toBeVisible();
	expect(await screensaver.boundingBox()).toStrictEqual(await page.locator('body').boundingBox());
});

test('closes when moving the mouse', async ({ page }) => {
	const screensaver = page.locator('body > iframe');
	await expect(screensaver).toBeVisible();
	await page.mouse.move(0, 0);
	await page.mouse.move(100, 100);
	await expect(screensaver).toHaveCount(0);
});

test('closes when clicking', async ({ page }) => {
	const screensaver = page.locator('body > iframe');
	await expect(screensaver).toBeVisible();
	await page.mouse.click(0, 0);
	await expect(screensaver).toHaveCount(0);
});

test('closes when pressing a key', async ({ page }) => {
	const screensaver = page.locator('body > iframe');
	await expect(screensaver).toBeVisible();
	await page.keyboard.press('a');
	await expect(screensaver).toHaveCount(0);
});

test('has an animated canvas', async ({ page }) => {
	test.skip(!!process.env.CI, 'needs WebGL, which CI runners lack');
	// Not every frame may differ from the last (sometimes pipes are offscreen),
	// so just check that we get enough unique frames to know it's animating.
	const canvas = page.frameLocator('body > iframe').locator('#canvas-webgl');
	await expect(canvas).toBeVisible();
	expect(await canvas.evaluate((canvas: HTMLCanvasElement) => {
		const frames = new Set();
		return new Promise((resolve) => {
			function animate() {
				frames.add(canvas.toDataURL());
				if (frames.size > 10) {
					resolve(frames.size);
				} else {
					requestAnimationFrame(animate);
				}
			}
			animate();
		});
	})).toBeGreaterThan(10);
});
