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
} as const;

export default defineConfig({ worker: stagingWorker });
