import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { repoUrl } from '../src/lib/wiki.js';

const pages = [
  { route: '/', file: 'index.html', source: 'src/pages/index.astro' },
  { route: '/About_Kenshi', file: 'About_Kenshi.html', source: 'src/pages/About_Kenshi.astro' },
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

    const desktopCredit = header.getByRole('link', { name: 'Contributors', exact: true });
    await desktopCredit.click();
    await expect(page).toHaveURL(new URL('/Contributors', origin).href);
    await expect(page.getByRole('main')).toContainText(creditIntro);
    await page.goBack();
    await expect(page).toHaveURL(new URL(route, origin).href);

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
    await tools.getByRole('link', { name: 'Contributors', exact: true }).click();
    await expect(page).toHaveURL(new URL('/Contributors', origin).href);
    await expect(page.getByRole('main')).toContainText(creditIntro);
    await page.locator('footer a[href="/Contributors#licensing"]').click();
    await expect(page.getByRole('heading', { name: 'Licenses and reuse' })).toBeInViewport();
    await page.waitForLoadState('networkidle');
    expect(outside).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('unknown routes return a genuine 404', async ({ request }) => {
  expect((await request.get('/missing-wiki-staging-check')).status()).toBe(404);
});

test('the old /Kenshi address permanently redirects to About Kenshi', async ({ request, baseURL }) => {
  test.skip(process.env.WIKI_TEST_STAGING !== '1', 'astro preview does not apply _redirects');
  for (const route of ['/Kenshi', '/Kenshi.html']) {
    const response = await request.get(route, { maxRedirects: 0 });
    expect(response.status(), route).toBe(301);
    expect(new URL(response.headers().location, baseURL).pathname, route).toBe('/About_Kenshi');
  }
});

const creditsPage = '/Contributors';
const creditIntro = 'VlcekM built the original Astro prototype and proposed RimWorld Wiki as the model for its presentation.';

test('credits, upstream licenses and editable sources are public on the wiki', async ({ page, request, baseURL }) => {
  const origin = new URL(baseURL).origin;
  const thirdParty = [];
  await page.route(/^https?:\/\//, route => {
    if (new URL(route.request().url()).origin === origin) return route.continue();
    thirdParty.push(route.request().url());
    return route.abort();
  });
  const response = await page.goto(creditsPage, { waitUntil: 'networkidle' });
  expect(response.status()).toBe(200);
  expect(await response.body()).toEqual(await readFile('dist/Contributors.html'));
  if (process.env.WIKI_TEST_STAGING === '1') {
    expect(response.headers()['x-robots-tag']).toContain('noindex');
    expect(response.headers()['cache-control']).toContain('no-transform');
  }
  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { name: 'Contributors', exact: true })).toBeVisible();
  await expect(main).toContainText(creditIntro);
  for (const handle of ['VlcekM', 'mattresspad']) {
    await expect(main.getByRole('link', { name: handle, exact: true })).toHaveAttribute('href', 'https://github.com/' + handle);
  }
  await expect(main.getByRole('link', { name: 'repository history' })).toHaveAttribute('href', repoUrl + '/commits/main/');
  for (const href of await main.locator('a[href^="/notices/"]').evaluateAll(links => links.map(link => link.pathname))) {
    const file = await request.get(href);
    expect(file.status(), href).toBe(200);
    expect(await file.body(), href).toEqual(await readFile('public' + href));
  }
  for (const [slug, input] of [['outland', 'global'], ['wiki-header', 'wiki-header']]) {
    const href = '/sources/' + slug + '.css.txt';
    await expect(main.locator('a[href="' + href + '"]')).toBeVisible();
    const file = await request.get(href);
    expect(file.status()).toBe(200);
    expect((await file.text()).replaceAll('\r\n', '\n')).toBe((await readFile('src/styles/' + input + '.css', 'utf8')).replaceAll('\r\n', '\n'));
  }
  expect(thirdParty).toEqual([]);
});
