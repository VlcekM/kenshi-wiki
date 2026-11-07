import { defineConfig } from 'astro/config';
import cloudflareStatic from './scripts/cloudflare-static.mjs';

export default defineConfig({
  site: 'https://kenshi.wiki',
  output: 'static',
  integrations: [cloudflareStatic()],
  // Kenshi.html rather than Kenshi/index.html, so pages live at /Kenshi like wiki URLs.
  build: {
    format: 'file',
  },
});
