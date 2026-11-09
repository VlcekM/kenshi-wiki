// Searching the Pagefind index from the browser, shared by the Search page and the header's suggestions.

export interface Result {
  url: string;
  excerpt: string;
  meta: { title?: string };
}

// Pagefind lists /about-kenshi.html; the wiki serves it at /about-kenshi.
export const pagePath = (url: string) => url.replace(/\.html$/, '');

export const resultTitle = (result: Result) => result.meta.title ?? pagePath(result.url).slice(1).replaceAll('-', ' ');

const normalized = (text: string) => text.replaceAll('_', ' ').trim().toLowerCase();

export const sameTitle = (a: string, b: string) => normalized(a) === normalized(b);

const words = (text: string) => text.toLowerCase().match(/[\p{L}\p{N}']+/gu) ?? [];

// For a word it does not know, Pagefind falls back to its longest indexed prefix, down to a single letter. A highlight
// counts only if it extends a search word ("nod" finds "nodachi") or nearly spells it ("armours" finds "armour").
function matchesQuery(result: Result, terms: string[]) {
  const marks = [...result.excerpt.matchAll(/<mark>(.*?)<\/mark>/g)].flatMap((mark) => words(mark[1]));
  const resembles = (mark: string, term: string) =>
    mark.startsWith(term) || (term.startsWith(mark) && mark.length >= Math.max(3, term.length - 2));
  return marks.some((mark) => terms.some((term) => resembles(mark, term)));
}

let pagefind: Promise<{ search: (text: string) => Promise<{ results: { data: () => Promise<Result> }[] } | null> }>;

function loadIndex() {
  const indexUrl = '/pagefind/pagefind.js';
  pagefind ??= import(/* @vite-ignore */ indexUrl);
  return pagefind;
}

export async function findPages(text: string, limit = 20): Promise<Result[]> {
  const search = await (await loadIndex()).search(text);
  const results = await Promise.all((search?.results ?? []).slice(0, limit).map((result) => result.data()));
  return results.filter((result) => matchesQuery(result, words(text)));
}

export interface Suggestion {
  title: string;
  path: string;
}

let titles: Promise<[string, string][]> | undefined;

// The list of page titles, and the search index, loaded ahead of the first keystroke.
export function preloadSuggestions() {
  titles ??= fetch('/search-titles.json').then((response) => response.json());
  loadIndex().catch(() => {});
  return titles;
}

// How well a title matches: exact, starts with the query, has a word starting with it, contains it anywhere.
function titleRank(title: string, query: string) {
  if (title === query) return 0;
  if (title.startsWith(query)) return 1;
  if (title.includes(` ${query}`) || title.includes(`(${query}`)) return 2;
  return title.includes(query) ? 3 : -1;
}

// Titles matching the query, best first, then shorter titles first. Runs in the browser on every keystroke.
export function matchTitles(list: [string, string][], text: string, limit = 8): Suggestion[] {
  const query = normalized(text);
  return list
    .map(([title, path]) => ({ title, path, rank: titleRank(normalized(title), query) }))
    .filter((match) => match.rank >= 0)
    .sort((a, b) => a.rank - b.rank || a.title.length - b.title.length || a.title.localeCompare(b.title))
    .slice(0, limit)
    .map(({ title, path }) => ({ title, path }));
}

// Pages whose text mentions the query, for when too few titles match.
export async function textSuggestions(text: string, limit: number): Promise<Suggestion[]> {
  const results = await findPages(text, limit + 8);
  return results.map((result) => ({ title: resultTitle(result), path: pagePath(result.url) }));
}
