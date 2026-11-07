import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { repoUrl } from '../src/lib/wiki.js';

const pages = [
  { route: '/', file: 'index.html', source: 'src/pages/index.astro' },
  { route: '/Kenshi', file: 'Kenshi.html', source: 'src/pages/Kenshi.astro' },
];

for (const { route, file, source } of pages) {
  test(`the reader can use ${route} entirely on the wiki origin`, async ({ page, baseURL }) => {
    const origin = new URL(baseURL).origin;
    const outside = [];
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {
      if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
    });
    await page.route(/^https?:\/\//, request => {
      if (new URL(request.request().url()).origin === origin) return request.continue();
      outside.push(request.request().url());
      return request.abort();
    });

    const response = await page.goto(route, { waitUntil: 'networkidle' });
    expect(response.status()).toBe(200);
    expect(await response.body()).toEqual(await readFile(`dist/${file}`));
    if (process.env.WIKI_TEST_STAGING === '1') {
      expect(response.headers()['x-robots-tag']).toContain('noindex');
      expect(response.headers()['cache-control']).toContain('no-transform');
    }

    const header = page.locator('.wiki-header');
    await expect(header.getByRole('link', { name: 'Meitou', exact: true })).toBeVisible();
    await expect(header.getByRole('link', { name: 'Edit on GitHub' })).toHaveAttribute('href', `${repoUrl}/edit/main/${source}`);
    await expect(header.getByRole('link', { name: 'View history' })).toHaveAttribute('href', `${repoUrl}/commits/main/${source}`);

    await page.evaluate(() => window.scrollTo(0, 450));
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
    await expect.poll(() => header.evaluate(el => Math.round(el.getBoundingClientRect().top))).toBe(0);

    await page.setViewportSize({ width: 390, height: 844 });
    const links = header.locator('.all-sites-menu');
    await links.locator('summary').press('Enter');
    await expect(links.locator('a:visible')).toHaveCount(16);
    const pictures = await links.locator('img').evaluateAll(async images => {
      await Promise.all(images.map(image => image.decode()));
      return images.map(image => new URL(image.currentSrc).origin);
    });
    expect(pictures.length).toBeGreaterThan(0);
    expect(new Set(pictures)).toEqual(new Set([origin]));
    await page.keyboard.press('Escape');
    await expect(links.locator('summary')).toBeFocused();

    const tools = header.locator('.tools-menu');
    await tools.locator('summary').click();
    await expect(tools.getByRole('link', { name: 'Edit on GitHub' })).toBeVisible();
    await page.keyboard.press('Escape');
    await page.waitForLoadState('networkidle');
    expect(outside).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('unknown routes return a genuine 404', async ({ request }) => {
  expect((await request.get('/missing-wiki-staging-check')).status()).toBe(404);
});
