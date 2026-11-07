import {
  cleanBuildOutputDir,
  writeAssets,
  writeRootConfig,
  writeWorkerConfig,
} from '@cloudflare/build-output-utils';
import { fileURLToPath } from 'node:url';
import { stagingWorker } from '../cloudflare.config.ts';

// Stage the exact static files that Astro produced. The deploy step consumes this package.
export default function cloudflareStatic() {
  return {
    name: 'wiki-staging-assets',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        const root = fileURLToPath(new URL('../', import.meta.url));
        await cleanBuildOutputDir(root);
        await writeRootConfig(root, undefined, { isPreview: false });
        await writeWorkerConfig({ root, config: stagingWorker });
        await writeAssets({ root, sourceDirectory: fileURLToPath(dir) });
      },
    },
  };
}
