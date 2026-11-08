import { defineConfig } from 'cf/config';

export const wikiWorker = {
  name: 'kenshi-wiki',
  domains: ['kenshi.wiki'],
  compatibilityDate: '2026-11-07',
  workersDev: false,
  previewUrls: true,
  assets: {
    htmlHandling: 'drop-trailing-slash',
    notFoundHandling: 'none',
  },
  // worker/index.js asks the assets whether a page exists before redirecting to it.
  env: {
    ASSETS: { type: 'assets' },
  },
} as const;

export default defineConfig({ worker: wikiWorker });
