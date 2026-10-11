# Jom — AI automation portfolio

Static Astro site for Jomari "Jom" Villanueva: AI automations built with Zapier, n8n, and AI. Deployed to GitHub Pages. No client framework, no external runtime requests.

Live (after deploy): https://jomvill.github.io/personal-portfolio/ · Repository: `JomVill/personal-portfolio`

## Develop

Node.js 24 LTS (minimum 22.12).

```sh
npm install
npm run dev
```

Checks (CI runs the same):

```sh
npm run format:check
npm run check
npm run lint
BASE_PATH=/personal-portfolio/ npm run build
npm test
```

Browser checks (Playwright + axe) against a preview of the built site:

```sh
BASE_PATH=/personal-portfolio/ npm run preview
BROWSER_CHANNEL=chrome PREVIEW_URL=http://localhost:4321/personal-portfolio/ npm run test:browser
```

## Pages

- `/` home: hero, Claude Code-style terminal, tool logo marquee, featured workflow, three workflow cards, contact.
- `/work/` and `/work/<slug>/`: all eight n8n workflows with diagrams, plain-language steps, tools.
- `/about/`, `/academic/` (research, publications, teaching, policy), `/cv/` (printable).
- Old URLs (`/research/`, `/teaching/`, `/writing/`, old `/work/` slugs) redirect.

## Content

- `src/data/workflows.json`: sanitized n8n workflow structure (names, node types, positions, connections only). Regenerate from an n8n export:
  ```sh
  docker exec <n8n-container> n8n export:workflow --all --separate --output=/tmp/wf/
  docker cp <n8n-container>:/tmp/wf/. ./n8n-export/   # keep outside git
  npm run import:n8n -- ./n8n-export
  ```
  `tests/site.test.mjs` fails if credentials, IDs, emails, or parameters leak into the file.
- `src/data/workflow-copy.ts`: titles, summaries, steps, labels, and tools for each workflow (plain, CEO-readable).
- `src/data/profile.ts`, `src/data/publications.ts`: contact, roles, academic content.
- `src/assets/brand/`: the owner-designed JOM logo and favicons. Use as supplied; do not redraw or recolor.
- `src/styles/site.css`: tokens and shared components; page styles live beside it.

## Deploy

`.github/workflows/deploy.yml` builds and deploys on push to `master`. In the repository, set **Settings → Pages → Source: GitHub Actions**. The base path is derived from the repository name; override with the `BASE_PATH` / `SITE_URL` Actions variables.

Design history and decisions: `docs/superpowers/specs/2026-10-11-portfolio-redesign-design.md`, mockups in `docs/mockups/`.
