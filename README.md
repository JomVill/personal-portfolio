# Jomari Francis Villanueva — personal portfolio

A static Astro portfolio connecting applied AI, research, education, technology policy, and IoT. Built for GitHub Pages with no client framework and no runtime service dependencies.

## Local development

Use Node.js 24 LTS (minimum 22.12).

```sh
npm install
npm run dev
```

Open the local URL printed by Astro. Production checks:

```sh
npm run check
npm run lint
npm run build
npm test
npm run preview
```

`npm test` validates generated HTML routes and local assets; run it after the build. The lockfile is included for reproducible installs (`npm ci`).

## GitHub Pages

1. Create a repository under `JomVill`, and push this project to its `master` branch, including `package-lock.json`.
2. In **Settings → Pages → Build and deployment**, choose **GitHub Actions**.
3. The included `.github/workflows/deploy.yml` installs, checks, lints, builds, validates internal links, and deploys `dist/`.
4. For `JomVill/jomvill.github.io`, the workflow automatically uses `/`. For `JomVill/personal-portfolio`, it automatically uses `/personal-portfolio/`. This is derived from GitHub's `GITHUB_REPOSITORY` variable.

Optional repository Actions variables:

- `SITE_URL`: origin, default `https://jomvill.github.io`. Do not include a project path here.
- `BASE_PATH`: overrides the automatic repository path, e.g. `/personal-portfolio/` or `/`.

Local project-path build:

```sh
BASE_PATH=/personal-portfolio/ npm run build
npm test
BASE_PATH=/personal-portfolio/ npm run preview
```

Browser checks (Playwright, axe) run against a built site:

```sh
BROWSER_CHANNEL=chrome npm run test:browser
```

For a custom domain, set `SITE_URL=https://your-domain.example` and `BASE_PATH=/`, and add `public/CNAME` containing the actual domain. Configure DNS and GitHub Pages accordingly. Do not add CNAME for the normal github.io deployment.

Repository: JomVill/personal-portfolio → https://jomvill.github.io/personal-portfolio/

## Content editing

- `src/data/profile.ts`: identity, email, social links, roles, teaching, themes, engagements.
- `src/data/projects.ts`: selected work and case studies; each slug creates `/work/<slug>/`.
- `src/data/publications.ts`: full authorship, venue, publication year/type, DOI.
- `src/pages/about.astro`: short professional narrative.
- `src/pages/cv.astro`: printable professional profile.
- `src/styles/global.css`: design tokens, grids, breakpoints, print styles.
- `src/lib/paths.ts`: prefixes all internal routes and public assets with the deployment base.

The CV page uses the two supplied CV documents and verified publication metadata. It supports printing or saving as PDF.

### Writing in Markdown

Create `src/content/writing/your-title.md`:

```md
---
title: 'Your actual article title'
description: 'A concise description of the article.'
date: 2026-09-18
draft: true
tags: [AI, technology policy]
---

Write the article here.
```

Set `draft: false` to publish. The collection validates frontmatter; the index sorts published posts newest first. Markdown is supported directly. No sample articles are published. If MDX becomes necessary, add the official Astro MDX integration and extend the collection glob.

## Design system

A restrained, instrument-inspired interface: warm white, silver surfaces, charcoal, and an orange accent. The homepage presents three selected projects through a tactile workflow display. Each selector updates the stages, summary, and project link. Preview flow animates an illustrative sequence; it does not execute an AI service or process user data. Keyboard navigation supports Left/Right, Home, and End. Reduced motion presents the completed sequence immediately.

DM Sans and Manrope are self-hosted. Project illustrations are lightweight HTML/CSS/SVG. The homepage has no image downloads, external scripts, analytics, or contact form. Contact links open email. Details live on secondary pages.

## Sources and assumptions

The supplied AI Automation and Philippines CVs inform career details. Publication metadata was checked through Crossref. No client performance metrics or confidential implementations are inferred. The workflow stages are explanatory illustrations, not live integrations. See `docs/content-sources.md` for source references.

## SEO and performance

Each route has a title, description, canonical URL, Open Graph fields, X summary-card metadata, and Person structured data. Astro creates the sitemap; robots.txt uses the selected site/base. A custom SVG favicon is included. No social-preview image was supplied, so no image URL is invented. Fonts and styles are served locally; there are no third-party scripts or image requests. Do not advertise a Lighthouse score until measuring the deployed site.
