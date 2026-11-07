# kenshi.wiki

Community wiki for [Kenshi](https://lofigames.com/), built with [Astro](https://astro.build) as a static site.

## Develop

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # static output in dist/
```

## Contributing

Contributions are made as pull requests on GitHub.

- Pages live in `src/pages/`; `Kenshi.astro` is an example article using every building block.
- Every page wraps its content in `src/layouts/WikiLayout.astro` (sidebar, header, footer, categories).
- Article building blocks live in `src/components/`: `Infobox`, `Toc`, `Gallery` and `Navbox`.
  Collapsed sections are plain `<details class="collapsible">`.
- Site-wide styles live in `src/styles/global.css`. Colors are theme tokens (`light-dark()`) defined at the top of that file;
  use them instead of raw colors so light and dark mode both work.

## Staging

The dedicated [staging wiki](https://kenshi-wiki-staging.prds.workers.dev/) is publicly readable.
Cloudflare serves the static Astro output, including the ribbon artwork. The staging hostname asks
search engines to leave it out of their indexes. Search and Random page are prototype routes.

[Wiki staging in GitHub Actions](https://github.com/mattresspad/kenshi-wiki/actions/workflows/staging.yml)
installs the locked dependencies, builds both pages, validates the Cloudflare package and exercises
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
