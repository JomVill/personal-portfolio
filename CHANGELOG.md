# Changelog

All notable changes to this project are documented here.

This project follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [2.1.0] - 2026-10-11

### Added

- Four-part n8n content pipeline: Daily Story Scout, Content Package Generator, Weekly Preference Learning, and Monthly Performance Review, each with a detail page (12 workflows in total).

### Changed

- Story Scout is the featured workflow and the hero terminal run; the featured eyebrow reads "Featured workflow · Content".
- Featured diagram beats are synced from copy data (`beats[].through`) instead of a hardcoded step map.
- Homepage cards are chosen with an explicit `homeCard` flag: Content Package Generator, Weekly Preference Learning, and Partnership.
- Workflow order puts the content pipeline first and Partnership fifth.
- Hero metric now reads "up to 60 hours a month" (owner's statement).

## [2.0.0] - 2026-10-11

### Changed

- Repositioned as an AI automation portfolio for "Jom": new homepage with a Claude Code-style terminal animation, tool logo marquee, and animated workflow diagrams.
- Owner-designed JOM logo and favicons.
- Contact email is now jomarivillanueva83@gmail.com.

### Added

- Eight real n8n workflows (sanitized import) with work index and per-workflow pages in plain, CEO-readable language.
- Academic page collecting research, publications, teaching, and policy work.

### Removed

- Research, teaching, and writing pages (redirected to `/academic/`); old case studies (redirected to `/work/`).

## [1.0.0] - 2026-09-22

### Added

- Astro-based personal portfolio for Jomari Francis Villanueva.
- Interactive homepage workflow display with three featured projects.
- Pages for work, research, teaching, about, curriculum vitae, writing, and a custom 404 page.
- Project case-study routes for AI automation, AI literacy and policy, digital government, and environmental sensing.
- Responsive layouts, reduced-motion support, keyboard navigation, skip link, and printable CV styling.
- SEO metadata, sitemap, robots.txt, social metadata, and person structured data.
- GitHub Pages deployment workflow with root-domain and project-path support.
- Static route and internal-link verification, plus browser accessibility and responsive checks.

### Sources

- Profile, employment, education, and training information drawn from the owner-provided CVs.
- Publication metadata and public references recorded in `docs/content-sources.md`.
