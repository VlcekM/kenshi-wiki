import { defineConfig } from '@playwright/test';

const staging = process.env.WIKI_TEST_STAGING === '1';
const localURL = 'http://127.0.0.1:4347';

export default defineConfig({
  testDir: './tests',
  workers: 1,
  reporter: 'list',
  timeout: 30_000,
  use: {
    baseURL: staging ? 'https://kenshi-wiki-staging.prds.workers.dev' : localURL,
    viewport: { width: 1440, height: 900 },
    colorScheme: 'dark',
    serviceWorkers: 'block',
  },
  webServer: staging ? undefined : {
    command: 'npm run preview -- --host 127.0.0.1 --port 4347',
    url: localURL,
    reuseExistingServer: false,
  },
});
