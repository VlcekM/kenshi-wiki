import { defineConfig } from '@playwright/test';

const target = process.env.WIKI_TEST_TARGET ?? (process.env.WIKI_TEST_STAGING === '1' ? 'staging' : undefined);
const origins = {
  staging: 'https://kenshi-wiki-staging.prds.workers.dev',
  production: 'https://kenshi.wiki',
};
if (target && !Object.hasOwn(origins, target)) throw new Error('Unknown wiki test target: ' + target);
const localURL = 'http://127.0.0.1:4347';

export default defineConfig({
  testDir: './tests',
  workers: 1,
  reporter: 'list',
  timeout: 30_000,
  use: {
    baseURL: origins[target] ?? localURL,
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
