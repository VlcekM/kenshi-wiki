import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { pageSlug, repoUrl } from '../src/lib/wiki.js';
import worker from '../worker/index.js';

const pages = [
  { route: '/', file: 'index.html', source: 'src/pages/index.astro' },
  { route: '/about-kenshi', file: 'about-kenshi.html', source: 'src/pages/about-kenshi.astro' },
  { route: '/the-holy-nation', file: 'the-holy-nation.html', source: 'src/content/wiki/the-holy-nation.md' },
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
    await expect(page).toHaveURL(new URL('/contributors', origin).href);
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
    await expect(page).toHaveURL(new URL('/contributors', origin).href);
    await expect(page.getByRole('main')).toContainText(creditIntro);
    await page.locator('footer a[href="/contributors#licensing"]').click();
    await expect(page.getByRole('heading', { name: 'Licenses and reuse' })).toBeInViewport();
    await page.waitForLoadState('networkidle');
    expect(outside).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('the header search finds pages and Go opens an exact title', async ({ page, baseURL }) => {
  const origin = new URL(baseURL).origin;
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');

  const search = page.locator('#searchInput');
  await search.fill('no chosen hero');
  await search.press('Enter');
  const results = page.locator('.mw-search-results');
  await expect(results.getByRole('link', { name: 'About Kenshi', exact: true })).toHaveAttribute('href', '/about-kenshi');
  await expect(results.locator('mark').first()).toBeVisible();

  await page.locator('#searchText').fill('qqxyzzy');
  await page.locator('#searchText').press('Enter');
  await expect(page.locator('.search-status')).toHaveText('There were no results matching “qqxyzzy”.');

  await page.locator('#searchInput').fill('about kenshi');
  await page.locator('#searchButton').click();
  await expect(page).toHaveURL(new URL('/about-kenshi', origin).href);
  expect(errors).toEqual([]);
});

test('Random page opens an article, and category links lead to their category', async ({ page, baseURL }) => {
  await page.goto('/');
  await page.locator('#p-navigation').getByRole('link', { name: 'Random page' }).click();
  await page.waitForURL((url) => url.pathname !== '/random' && url.pathname !== '/');
  await expect(page.locator('.fandom-notice')).toBeVisible();

  await page.goto('/nodachi');
  await page.locator('#catlinks').getByRole('link', { name: 'Weapons', exact: true }).click();
  await expect(page).toHaveURL(new URL('/category/weapons', baseURL).href);
  await expect(page.locator('.category-columns').getByRole('link', { name: 'Nodachi', exact: true })).toHaveAttribute('href', '/nodachi');
});

// Git, not the working tree: on Windows and macOS a file renamed only in case keeps its old name in the index, and
// CI builds from the index.
test('every article file is named for its canonical path', () => {
  const files = execFileSync('git', ['ls-files', 'src/content/wiki'], { encoding: 'utf8' }).split('\n').filter(Boolean);
  const misnamed = files.filter((file) => {
    const id = file.replace(/^src\/content\/wiki\//, '').replace(/\.md$/, '');
    return id !== pageSlug(id);
  });
  expect(files.length).toBeGreaterThan(0);
  expect(misnamed).toEqual([]);
});

test('unknown routes return a genuine 404', async ({ request }) => {
  expect((await request.get('/missing-wiki-staging-check')).status()).toBe(404);
});

// Another spelling of a page's path, or an old address, ends at the page through permanent redirects.
const respellings = [
  ['/About_Kenshi', '/about-kenshi'],
  ['/about_kenshi.html', '/about-kenshi'],
  ['/Kenshi', '/about-kenshi'],
  ['/Kenshi.html', '/about-kenshi'],
  ['/The_Holy_Nation', '/the-holy-nation'],
  ['/Holy_Nation', '/the-holy-nation'],
];

test('the Worker redirects another spelling only to a page that exists', async () => {
  const pages = new Set(['/about-kenshi', '/kenshi']);
  const env = { ASSETS: { fetch: async (request) => new Response(null, { status: pages.has(new URL(request.url).pathname) ? 200 : 404 }) } };
  const visit = (path) => worker.fetch(new Request(new URL(path, 'https://kenshi.wiki')), env);

  for (const [path, target] of [['/About_Kenshi?x=1', '/about-kenshi?x=1'], ['/About_kenshi.html', '/about-kenshi'], ['/Kenshi', '/kenshi']]) {
    const response = await visit(path);
    expect(response.status, path).toBe(301);
    expect(response.headers.get('location'), path).toBe(`https://kenshi.wiki${target}`);
  }
  for (const path of ['/Missing_Page', '/missing-page', '/%E0%A4%A']) expect((await visit(path)).status, path).toBe(404);
});

test('old and differently spelled addresses permanently redirect to the page', async ({ request, baseURL }) => {
  test.skip(process.env.WIKI_TEST_STAGING !== '1', 'astro preview runs neither the Worker nor _redirects');
  for (const [route, target] of respellings) {
    expect((await request.get(route, { maxRedirects: 0 })).status(), route).toBe(301);
    const response = await request.get(route);
    expect(response.status(), route).toBe(200);
    expect(new URL(response.url(), baseURL).pathname, route).toBe(target);
  }
});

const creditsPage = '/contributors';
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
  expect(await response.body()).toEqual(await readFile('dist/contributors.html'));
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
