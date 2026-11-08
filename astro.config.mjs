import { defineConfig } from 'astro/config';
import cloudflareStatic from './scripts/cloudflare-static.mjs';
import searchIndex from './scripts/search-index.mjs';

export default defineConfig({
  site: 'https://kenshi.wiki',
  output: 'static',
  // Hooks run in order: the search index must exist before the deploy package copies the build.
  integrations: [searchIndex(), cloudflareStatic()],
  // Kenshi.html rather than Kenshi/index.html, so pages live at /Kenshi like wiki URLs.
  build: {
    format: 'file',
  },
});
