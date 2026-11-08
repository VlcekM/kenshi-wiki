# kenshi.wiki

Community wiki for [Kenshi](https://lofigames.com/), built with [Astro](https://astro.build) as a static site.

## Contributors and licenses

[VlcekM](https://github.com/VlcekM) built the original Astro prototype and proposed RimWorld Wiki as the model for its presentation. Prd ([mattresspad](https://github.com/mattresspad)) founded and maintains Kenshi Wiki, added the ecosystem navigation, and set up the site’s Cloudflare deployment. The wiki’s theme, Outland, adapts the legacy Vector skin and styling from RimWorld Wiki.

The [Contributors page on staging](https://kenshi-wiki-staging.prds.workers.dev/contributors) gives the upstream credits, license texts, and editable skin sources. The [repository history](https://github.com/mattresspad/kenshi-wiki/commits/main/) records individual changes.

Original wiki article text is licensed under [CC BY-SA 4.0](public/notices/CC-BY-SA-4.0.txt); articles adapted from the Kenshi Fandom wiki stay under [CC BY-SA 3.0](public/notices/CC-BY-SA-3.0.txt) and credit their source. A general license for original project software is deferred. The [Vector license](public/notices/Vector-COPYING.txt), [MediaWiki notices](public/notices/MediaWiki-COPYING.txt), and [RimWorld Wiki policy](https://rimworldwiki.com/wiki/RimWorld_Wiki:Copyrights) apply to their respective materials. See the [artwork inventory](public/notices/artwork.txt) for per-file terms and outstanding questions before publishing Git history.

## Develop

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # static output in dist/
npm run preview  # serve the build, with search
```

Search uses a [Pagefind](https://pagefind.app) index that `npm run build` writes to `dist/pagefind/`, so it only works on a build.
It indexes each page's `<main>`; pass `searchable={false}` to `WikiLayout` to leave a page out.

## Contributing

Contributions are made as pull requests on GitHub.

- Articles imported from the Kenshi Fandom wiki live in `src/content/wiki/` as Markdown, one file per page (CC BY-SA 3.0,
  credited on each page). `node scripts/import-fandom.mjs [title ...]` re-imports them; images are not imported.
- Page URLs are lowercase with hyphens (`/about-kenshi`), made by `pageSlug` in `src/lib/wiki.js`. On Cloudflare,
  `worker/index.js` redirects other spellings (`/About_Kenshi`) to them.
- Pages live in `src/pages/`; `about-kenshi.astro` is an example article using every building block.
- Every page wraps its content in `src/layouts/WikiLayout.astro` (sidebar, header, footer, categories).
- Article building blocks live in `src/components/`: `Infobox`, `Toc`, `Gallery` and `Navbox`.
  Collapsed sections are plain `<details class="collapsible">`.
- Site-wide styles live in `src/styles/global.css`. Colors are theme tokens (`light-dark()`) defined at the top of that file;
  use them instead of raw colors so light and dark mode both work.

## Staging

The dedicated [staging wiki](https://kenshi-wiki-staging.prds.workers.dev/) is publicly readable.
Cloudflare serves the static Astro output, including the ribbon artwork. The staging hostname asks
search engines to leave it out of their indexes. Search and Random page are included in the reader checks.

[Wiki staging in GitHub Actions](https://github.com/mattresspad/kenshi-wiki/actions/workflows/staging.yml)
installs the locked dependencies, builds the wiki, validates the Cloudflare package and exercises
the reader in Chromium. Pull requests run the checks. A push to `main`, or a manual run from
`main`, deploys that same checked package to `kenshi-wiki-staging` and repeats the reader tests
over HTTPS. Each accepted run records its commit, Worker version and run link in the job summary.

Use Node from `.node-version`. To reproduce the local checks:

```sh
npm ci
npm run build
npm run staging:dry-run
npm exec -- playwright install chromium
npm test
```

The deploy step reads the repository variable `CLOUDFLARE_ACCOUNT_ID` and repository secret
`CLOUDFLARE_API_TOKEN`. The account-owned token needs Workers Editor access to the existing
`kenshi-wiki-staging` Worker. The production hostname is managed separately.

## Promote to production

After **Wiki staging** passes on `main`, open **Actions → Promote to production → Run workflow**, select
`main`, and click **Run workflow**. The run publishes that commit to **https://kenshi.wiki** and tests
the live site, including legacy URLs, search, and the Nodachi category link.

Staging saves its accepted Cloudflare Build Output as a GitHub Actions artifact for 14 days.
Promotion downloads the artifact for the selected main commit. It carries the redirect Worker,
its module manifest, the `ASSETS` binding, Pagefind and static files together. It sets the Worker name
and custom domain for production and scopes the noindex header to the production workers.dev alias.
If the artifact has expired or predates this workflow, manually run **Wiki staging** on main and wait
for it to finish before retrying promotion.

The deploy step uses `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`. The token must be able to
deploy the existing `kenshi-wiki` Worker and apply its existing custom domain. To use a dedicated
credential, set a secret with that same name in the GitHub `production` environment. The run summary
links the staging run and records the production Worker version and Git commit.
