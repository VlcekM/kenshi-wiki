import { defineConfig } from 'cf/config';

export const stagingWorker = {
  name: 'kenshi-wiki-staging',
  compatibilityDate: '2026-11-07',
  workersDev: true,
  previewUrls: false,
  assets: {
    htmlHandling: 'drop-trailing-slash',
    notFoundHandling: 'none',
  },
  // worker/index.js asks the assets whether a page exists before redirecting to it.
  env: {
    ASSETS: { type: 'assets' },
  },
} as const;

export default defineConfig({ worker: stagingWorker });
