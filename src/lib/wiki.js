export const repoUrl = 'https://github.com/mattresspad/kenshi-wiki';

// Page title to URL path: spaces become underscores, as on MediaWiki. Every path must also be a file name on Windows, so a
// colon before a space is dropped and any other colon starts a subpage ("Update:0.20" is /Update/0.20). Characters
// that URLs reserve are dropped.
export const pageSlug = (title) =>
  title.replaceAll(': ', ' ').replaceAll(':', '/').replace(/[?#%"*<>|\\]/g, '').trim().replace(/\s+/g, '_');

export const wiki = (title) => `/${pageSlug(title)}`;

// Lo-Fi Games and Chris Hunt have no Wikipedia articles of their own; the game's covers both.
export const developmentUrl = 'https://en.wikipedia.org/wiki/Kenshi_(video_game)#Development';
