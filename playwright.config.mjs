import { defineConfig } from '@playwright/test';

const target = process.env.WIKI_TEST_TARGET;
const preview = process.env.WIKI_PREVIEW_URL;
const localURL = 'http://127.0.0.1:4347';
if (target && !['staging', 'production'].includes(target)) throw new Error('Unknown wiki test target.');
if (target && !/^https:\/\/[0-9a-f]{8}-kenshi-wiki\.prds\.workers\.dev$/.test(preview ?? '')) {
  throw new Error('Set WIKI_PREVIEW_URL to the uploaded version URL.');
}

export default defineConfig({
  testDir: './tests',
  workers: 1,
  reporter: 'list',
  timeout: 30_000,
  use: {
    baseURL: target === 'production' ? 'https://kenshi.wiki' : preview ?? localURL,
    headless: !(process.env.GITHUB_ACTIONS === 'true' && target === 'production'),
    viewport: { width: 1440, height: 900 },
    colorScheme: 'dark',
    serviceWorkers: 'block',
  },
  webServer: target ? undefined : {
    command: 'npm run preview -- --host 127.0.0.1 --port 4347',
    url: localURL,
    reuseExistingServer: false,
  },
});
