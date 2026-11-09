import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

// Every article's title and path, so the header search can suggest pages as fast as one types.
export const GET: APIRoute = async () => {
  const articles = await getCollection('wiki');
  const pages = [['About Kenshi', '/about-kenshi'], ['Contributors', '/contributors']];
  const titles = [...pages, ...articles.map((article) => [article.data.title, `/${article.id}`])];
  return new Response(JSON.stringify(titles), { headers: { 'Content-Type': 'application/json' } });
};
