import type { APIRoute } from 'astro';
import outland from '../../styles/global.css?raw';
import ribbon from '../../styles/wiki-header.css?raw';

// Publish the same editing inputs used by Astro, including their source comments.
export function getStaticPaths() {
  return [
    { params: { sheet: 'outland' }, props: { source: outland } },
    { params: { sheet: 'wiki-header' }, props: { source: ribbon } },
  ];
}

export const GET: APIRoute = ({ props }) =>
  new Response(props.source, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
