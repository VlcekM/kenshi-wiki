import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const worker = '.cloudflare/output/v0/workers/default';
const configPath = join(worker, 'worker.config.json');
const headersPath = join(worker, 'assets', '_headers');

const config = JSON.parse(await readFile(configPath, 'utf8'));
if (config.name !== 'kenshi-wiki-staging') {
  throw new Error('Expected the package produced by Wiki staging.');
}

const headers = await readFile(headersPath, 'utf8');
const stagingHost = 'https://kenshi-wiki-staging.prds.workers.dev/*';
if (!headers.split(/\r?\n/).includes(stagingHost)) {
  throw new Error('Expected a hostname-specific staging header rule.');
}

config.name = 'kenshi-wiki';
config.domains = ['kenshi.wiki'];
await writeFile(configPath, JSON.stringify(config, null, 2) + '\n');
await writeFile(headersPath, headers.replace(stagingHost, 'https://kenshi-wiki.prds.workers.dev/*'));
