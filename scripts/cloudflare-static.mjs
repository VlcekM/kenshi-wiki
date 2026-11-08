import {
  cleanBuildOutputDir,
  getWorkerBundleDir,
  writeAssets,
  writeRootConfig,
  writeWorkerConfig,
} from '@cloudflare/build-output-utils';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { stagingWorker } from '../cloudflare.config.ts';

// The Worker and the URL rule it shares with the site, as two modules side by side in the bundle.
async function writeWorkerBundle(root) {
  const bundle = getWorkerBundleDir(root);
  const source = (path) => readFile(new URL(path, import.meta.url), 'utf8');
  await mkdir(bundle, { recursive: true });
  await writeFile(`${bundle}/index.js`, (await source('../worker/index.js')).replace("'../src/lib/wiki.js'", "'./wiki.js'"));
  await writeFile(`${bundle}/wiki.js`, await source('../src/lib/wiki.js'));
  return { type: 'complete', mainModule: 'index.js', modules: { 'index.js': { type: 'esm' }, 'wiki.js': { type: 'esm' } } };
}

// Stage the exact static files that Astro produced, with the Worker that redirects other spellings of a page's path.
// The deploy step consumes this package.
export default function cloudflareStatic() {
  return {
    name: 'wiki-staging-assets',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        const root = fileURLToPath(new URL('../', import.meta.url));
        await cleanBuildOutputDir(root);
        await writeRootConfig(root, undefined, { isPreview: false });
        const manifest = await writeWorkerBundle(root);
        await writeWorkerConfig({ root, config: stagingWorker, manifest });
        await writeAssets({ root, sourceDirectory: fileURLToPath(dir) });
      },
    },
  };
}
