import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://kenshi.wiki',
  output: 'static',
  // Kenshi.html rather than Kenshi/index.html, so pages live at /Kenshi like wiki URLs.
  build: {
    format: 'file',
  },
});
