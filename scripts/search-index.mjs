import * as pagefind from 'pagefind';
import { fileURLToPath } from 'node:url';

// Index the built pages for the Search page. Runs before cloudflareStatic, so the index ships in the deploy package.
export default function searchIndex() {
  return {
    name: 'wiki-search-index',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const site = fileURLToPath(dir);
        const { index, errors } = await pagefind.createIndex({ forceLanguage: 'en' });
        if (!index) throw new Error(`Pagefind could not start: ${errors.join('; ')}`);

        const indexed = await index.addDirectory({ path: site });
        const written = await index.writeFiles({ outputPath: `${site}pagefind` });
        await pagefind.close();

        const failures = [...indexed.errors, ...written.errors];
        if (failures.length) throw new Error(`Pagefind failed: ${failures.join('; ')}`);
        logger.info(`Indexed ${indexed.page_count} pages for search.`);
      },
    },
  };
}
