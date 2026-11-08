export const repoUrl = 'https://github.com/mattresspad/kenshi-wiki';

// Page title to URL path: lowercase words joined by hyphens ("About Kenshi" is /about-kenshi). A colon before a space is
// dropped and any other colon starts a subpage ("Kenshi:Lua" is /kenshi/lua). Punctuation is dropped, except a dot
// between digits ("0.20"), so every path is also a file name on any OS. The Worker in worker/index.js sends other
// spellings of a path (/About_Kenshi) here, so this is also the rule it applies.
const slugSegment = (segment) =>
  segment
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/(?<!\d)\.|\.(?!\d)/g, '')
    .replace(/[^\p{L}\p{N}.-]/gu, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');

export const pageSlug = (title) =>
  title.replaceAll(': ', ' ').replaceAll(':', '/').split('/').map(slugSegment).filter(Boolean).join('/');

export const wiki = (title) => `/${pageSlug(title)}`;

// Lo-Fi Games and Chris Hunt have no Wikipedia articles of their own; the game's covers both.
export const developmentUrl = 'https://en.wikipedia.org/wiki/Kenshi_(video_game)#Development';
