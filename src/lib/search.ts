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

// Suggestions put pages whose title starts with the query first, then titles containing it, then the rest.
export async function suggestPages(text: string, limit = 8): Promise<Result[]> {
  const query = normalized(text);
  const rank = (result: Result) => {
    const title = normalized(resultTitle(result));
    return title.startsWith(query) ? 0 : title.includes(query) ? 1 : 2;
  };
  const results = await findPages(text, 20);
  return results.map((result, order) => ({ result, order })).sort((a, b) => rank(a.result) - rank(b.result) || a.order - b.order)
    .slice(0, limit).map(({ result }) => result);
}
