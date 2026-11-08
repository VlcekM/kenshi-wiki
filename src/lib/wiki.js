export const repoUrl = 'https://github.com/mattresspad/kenshi-wiki';

// Page title to URL: spaces become underscores, as on MediaWiki.
export const wiki = (title) => `/${title.replaceAll(' ', '_')}`;

// Lo-Fi Games and Chris Hunt have no Wikipedia articles of their own; the game's covers both.
export const developmentUrl = 'https://en.wikipedia.org/wiki/Kenshi_(video_game)#Development';
