export const repoUrl = 'https://github.com/mattresspad/kenshi-wiki';

// Page title to URL: spaces become underscores, as on MediaWiki.
export const wiki = (title) => `/${title.replaceAll(' ', '_')}`;
