# Portfolio Build (AI automation site) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the approved homepage mockup into the real Astro site: an AI-automation portfolio for "Jom" with 8 real n8n workflows, an academic page, and the owner's logo.

**Architecture:** Static Astro 7, no client framework. The approved mockup `docs/mockups/e2-automation.html` is the visual + copy source of truth: its CSS becomes site styles, its inline JS becomes small page scripts. Workflow facts come from a sanitized JSON generated from the owner's n8n export; diagrams render as SVG at build time.

**Tech Stack:** Astro 7, TypeScript, plain CSS, `simple-icons` (npm, inlined at build), node:test, Playwright + axe, Prettier.

**Spec:** `docs/superpowers/specs/2026-10-11-portfolio-redesign-design.md`

Supersedes `docs/superpowers/plans/2026-10-11-portfolio-redesign.md` Tasks 4–11 (its Tasks 1–2 are done).

## Global Constraints

- Deploy: GitHub Pages, base `/personal-portfolio/`; every internal URL and asset goes through `path()` from `src/lib/paths.ts` or Astro asset imports. Tests run against `BASE_PATH=/personal-portfolio/ npm run build`.
- No client framework, no external runtime requests (fonts self-hosted via @fontsource; logos inlined from the `simple-icons` package at build — never a CDN), no analytics, no contact form.
- Owner name on site: "Jom" (full name "Jomari Villanueva" allowed only in `<title>`/meta, footer copyright, and the Academic/CV pages). Contact: `jomarivillanueva83@gmail.com`.
- Logo: `src/assets/brand/jom-logo-black.png` / `jom-logo-white.png`, used as-is (never redrawn/recolored); favicons `src/assets/brand/favicon-{32,180,512}.png`. No photo anywhere.
- Copy rules: plain, short, CEO-readable; no "revolutionary", "leverage", "cutting-edge", "synergy", "passionate", "seamless". Never invent clients, metrics, or outcomes. The only metric is "up to 3 hours a day" (owner-supplied).
- Workflow data hygiene: committed data contains only workflow name, node names, node types, positions, connections. Never credentials, IDs, webhook paths, emails, channel/list IDs, prompts.
- Motion: every animation pauses off-screen (IntersectionObserver) and on hidden tab, and is static under `prefers-reduced-motion`.
- WCAG 2.1 AA (axe clean), no horizontal scroll at 375px and at 200% root font size, exactly one `<h1>` per page, `<html lang="en">`.

## Review Focus

1. **Project base path** — all links/assets resolve under `/personal-portfolio/` (existing `tests/static.test.mjs`).
2. **JavaScript disabled** — hero, featured workflow, cards, marquee all readable as static HTML (no empty terminal, diagrams present). Task 6 test.
3. **Reduced motion** — no animation runs; terminal shows final state; marquee becomes a static grid. Browser check (Task 9).
4. **Secrets leaking from n8n** — committed `src/data/workflows.json` contains no credential/ID/email fields. Task 3 test.
5. **Old URLs** — `/research/`, `/teaching/`, `/writing/` redirect to `/academic/`; old `/work/<old-slug>/` redirect to `/work/`. Task 4 test.

## File Structure

```
scripts/import-n8n.mjs           (T3) export dir → src/data/workflows.json
src/data/workflows.json          (T3) sanitized, committed
src/data/workflow-copy.ts        (T3) CEO copy per workflow (slug, title, summary, beats, tools, featured)
src/data/profile.ts              (T4) keep profile/email/social/experience/education/training/presentations/engagements/teaching
src/data/publications.ts         keep
src/lib/workflows.ts             (T3) join data+copy: getWorkflows(), getWorkflow(slug), mainPath()
src/components/WorkflowDiagram.astro (T3) SVG renderer
src/components/Header.astro, Footer.astro (T4)
src/components/LogoMarquee.astro  (T5)
src/components/Terminal.astro     (T5)
src/styles/site.css               (T4) tokens + base + shared components ported from e2
src/scripts/*.ts                  (T5) terminal.ts, marquee none (CSS), workflow-anim.ts
src/pages/index.astro             (T5)
src/pages/work/index.astro, work/[slug].astro (T6)
src/pages/about.astro, academic.astro, cv.astro, 404.astro (T7)
DELETE: src/pages/research.astro, teaching.astro, writing/, src/content/writing, src/data/channels.ts,
        src/data/projects.ts, components ProjectCard/ProjectVisual/SectionHeader/SocialLinks (T4/T7)
tests/site.test.mjs               extended per task
```

---

### Task 3: Workflow data + diagram component

**Files:** Create `scripts/import-n8n.mjs`, `src/data/workflows.json`, `src/data/workflow-copy.ts`, `src/lib/workflows.ts`, `src/components/WorkflowDiagram.astro`; Modify `package.json` (script `import:n8n`), `tests/site.test.mjs`.

**Interfaces (produces):**

- `workflows.json`: `[{ id: string /* slug */, name: string, nodes: {name,type,position:[x,y]}[], edges: {from,to,kind}[] }]`
- `workflow-copy.ts`: `export const workflowCopy: Record<string, { title: string; summary: string; tools: string[]; featured?: boolean; order: number; mainPath?: string[] /* node names */; labels?: Record<string,string> /* node name → CEO label */; beats?: {label:string; text:string}[] }>`
- `src/lib/workflows.ts`: `type Workflow = {...json, ...copy, slug}`; `getWorkflows(): Workflow[]` (sorted by order), `getWorkflow(slug)`, `featured(): Workflow`.
- `<WorkflowDiagram workflow={Workflow} variant="featured" | "card" | "full" />` → inline SVG, nodes rounded rects (diamond for `if`/`filter`/`switch` types), AI nodes (`agent`, `textClassifier`, `lmChat*` folded into their agent) get `data-kind="ai"`, human nodes (name contains "Human"/"Approved") `data-kind="human"`, each node `data-step={index}` along main path; `<title>` with workflow title.

- [ ] **Step 1: Importer.** `scripts/import-n8n.mjs <exportDir>` reads every `*.json`, keeps only `name`, non-sticky nodes `{name, type: type.split('.').pop(), position}`, and edges between kept nodes `{from,to,kind}`; slug = kebab-case of name; writes `src/data/workflows.json` (pretty). Run with the owner's export: `node scripts/import-n8n.mjs /private/tmp/claude-501/-Users-jomvill-Developer-Personal/c1cb0886-7ce4-4275-ae66-80384a8c14ef/scratchpad/n8n` (skip `sanitized.json`).
- [ ] **Step 2: Failing test** (append to `tests/site.test.mjs`):

```js
import { readFile as rf } from 'node:fs/promises';
test('workflows.json is sanitized', async () => {
  const raw = await rf('src/data/workflows.json', 'utf8');
  for (const bad of ['credential', 'webhookId', 'apiKey', '@', '"id":"', 'parameters'])
    assert.ok(!raw.includes(bad), bad);
  const data = JSON.parse(raw);
  assert.equal(data.length, 8);
  for (const w of data)
    for (const k of Object.keys(w)) assert.ok(['id', 'name', 'nodes', 'edges'].includes(k), k);
});
```

(Use `id` = slug; the `"id":"` check targets n8n-style ids — adjust the assertion to check no 16-char n8n ids appear, e.g. `/[A-Za-z0-9]{16}/` must not match any value.)

- [ ] **Step 3: Copy.** `workflow-copy.ts` with these exact strings (order 1–8):
  1. partnership-operations-automation — featured — "Partnership inquiries, handled end to end" — "AI screens every inquiry, you approve, and the CRM, contract, and invoice follow." — tools Gmail, OpenAI, Slack, HubSpot, Trello, QuickBooks — mainPath/labels/beats exactly as in the mockup's featured section (10 labels: New inquiry, AI checks fit, Good fit?, You review, Approved?, Add to CRM, Send contract, Follow up, Start project, Send invoice; 4 beats as in mockup).
  2. shift-timesheet-reminders-ai-validation — "Timesheets that check themselves" — "Staff get reminders before shifts end. Mistakes go straight to a manager." — Clockify, Slack, Trello, OpenAI.
  3. ai-email-classifier — "Every email reaches the right team" — "AI reads incoming mail and routes it to support, billing, or general." — Gmail, OpenAI, Slack.
  4. article-to-social-content — "One article, ready-to-post social content" — "AI writes the caption and image, then queues it for your review." — OpenAI, Placid, Buffer, Slack.
  5. google-form-to-hubspot-with-10-link-and-1000-contract — "Sign-ups that route themselves" — "New form entries land in your CRM and get the right offer or contract automatically." — Google Sheets, HubSpot, Gmail, OpenAI.
  6. create-invoice-from-hubspot-to-quickbooks — "Won deals invoice themselves" — "When a deal closes, the invoice is created and finance is notified." — HubSpot, QuickBooks, Slack.
  7. slack-message-to-clickup — "Chat messages become tasks" — "AI turns a Slack message into a ClickUp task with a due date." — Slack, OpenAI, ClickUp.
  8. set-a-meeting-via-slack — "Meetings booked from a chat message" — "AI reads the request, finds the contact, and books a Google Meet." — Slack, OpenAI, HubSpot, Google Calendar.
     (Slugs must equal the importer's kebab-case output; fix copy keys to match, not the other way round.)
- [ ] **Step 4: Diagram component** port the mockup's diagram look (dark display for `featured`, light for `card`/`full`). `featured` and `card` use `mainPath` if set, else a simplified layout from node positions; `full` draws all nodes from positions (normalized, AI sub-nodes folded). Test: build a temp page? No — test through Task 5/6 pages. Here, add `astro check` + a unit-ish test that `src/lib/workflows.ts` slugs match json ids by importing the json in the test and reading copy keys via regex.
- [ ] **Step 5:** `npm run format && npm run check && npm run lint && BASE_PATH=/personal-portfolio/ npm run build && npm test` → PASS. Commit "Add sanitized n8n workflow data, CEO copy, and diagram component".

### Task 4: Site shell, styles, cleanup, redirects

**Files:** Create `src/styles/site.css`; Modify `src/layouts/Layout.astro`, `Header.astro`, `Footer.astro`, `astro.config.mjs` (redirects), `src/data/profile.ts`; Delete `src/styles/global.css`, `src/data/channels.ts`, `src/data/projects.ts`, `src/pages/research.astro`, `teaching.astro`, `writing/`, `src/content/writing/`, `src/content.config.ts` (no collections left), components ProjectCard/ProjectVisual/SectionHeader/SocialLinks; temporarily reduce `index.astro`/`work/*` to minimal placeholders only if needed to keep the build green (Tasks 5–6 replace them).

- Port from the mockup: tokens (paper, ink, muted, accent #ee652b, accent-text #ad3b0f, silver panel, screen colors), Manrope/DM Sans via @fontsource, key/button styles, silver panel, mono label, layout `.wrap`, section rhythm.
- Header: logo img (black PNG, alt "Jom — home", width/height by aspect 1284:591, ~30px tall) linking home; nav Work · About; "Email me" key (mailto). Footer: "© {year} Jomari Villanueva", links Academic work · LinkedIn · GitHub · Email.
- Layout: favicons `<link rel="icon" sizes="32x32">`, `apple-touch-icon` 180; title default "Jom — AI automation"; description "I connect your tools with Zapier, n8n, and AI so the busywork runs itself."; person JSON-LD name "Jomari Villanueva", alternateName "Jom".
- Redirects: `/research/`, `/teaching/`, `/writing/` → `/academic/`; `/work/applied-ai/`, `/work/ai-literacy-policy/`, `/work/digital-government/`, `/work/environmental-sensing/` → `/work/`. Verify Astro prefixes base on destinations; if not, write destinations with the base via `process.env.BASE_PATH`-aware config.
- [ ] **Failing tests** (append): header contains logo img + "Email me" mailto with the gmail address and no "Jomari" text in header; footer contains "Academic work"; `dist/research/index.html` contains a redirect to `${base}academic/`; `dist/work/applied-ai/index.html` redirects to `${base}work/`.
- [ ] Implement → full verification as Task 3 Step 5 → commit "Rebuild site shell with JOM brand, port mockup styles, remove old pages, add redirects".

### Task 5: Homepage

**Files:** Modify `src/pages/index.astro`; Create `src/components/Terminal.astro`, `src/components/LogoMarquee.astro`, `src/scripts/terminal.ts`, `src/scripts/workflow-anim.ts`; Modify `package.json` (add `simple-icons` exact version) and `tests/site.test.mjs`.

- Port the mockup's homepage sections 1:1 (hero copy exactly, terminal animation, marquee, featured workflow from `featured()` + `WorkflowDiagram variant="featured"` + beats, "More time-savers" = workflows order 2–4 with `variant="card"`, contact section, links to `path('work/')` and `path('work/<slug>/')`).
- Terminal: server-render the FINAL state in HTML (all steps visible) so no-JS and reduced-motion users see it; JS replays the animation only when motion is allowed.
- Marquee: inline SVG paths from `simple-icons` (`import { siZapier, ... } from 'simple-icons'`) with brand hex; names as text; Claude via `siClaude` if present, else text. Duplicate track `aria-hidden="true"`.
- Packet animation: `workflow-anim.ts` drives `[data-step]` nodes and beats as in the mockup.
- [ ] **Failing tests:** home has exactly one h1 with "Hi, I’m Jom, and I automate repetitive tasks."; contains "3 hours a day"; terminal final-state lines "Gmail trigger" and "Approved in Slack" present in HTML; marquee first item is Zapier; featured title present; 3 card titles present with links to `${base}work/<slug>/`; no `cdn.jsdelivr` or `fonts.googleapis` in HTML.
- [ ] Implement → verify → commit "Build homepage from approved mockup".

### Task 6: Work pages

**Files:** Modify `src/pages/work/index.astro`, `src/pages/work/[slug].astro`; tests.

- `/work/`: heading "Workflows I built", one-line intro "Each one runs in n8n, with AI doing the reading and a person approving what matters.", grid of all 8 cards (same card component style as home; extract `WorkflowCard.astro` and reuse on home).
- `/work/<slug>/`: back link; title; summary; `WorkflowDiagram variant="full"`; "How it runs" ordered step list from mainPath labels or node names in path order (CEO-readable: strip tool prefixes, keep short); "Built with" tool chips; "Where you stay in control" one line when a human node exists (else omit); CTA "Want one like this?" mailto.
- [ ] **Failing tests:** 8 pages exist under `dist/work/<slug>/`; each has one h1 equal to its copy title; `/work/` lists 8 links.
- [ ] Implement → verify → commit "Add work index and per-workflow pages".

### Task 7: About, Academic, CV, 404

**Files:** Modify `about.astro`, `cv.astro`, `404.astro`; Create `academic.astro`; Delete remaining unused components (PublicationItem only if unused); tests.

- About: h1 "About Jom"; 3 short paragraphs in first person: builds AI automations in Zapier and n8n; previously Head of Technology & Research at Future AI Lab / BrandNat (2022–2026) building AI workflows and agents; based in Iligan City, Philippines; one credibility line "Also: Assistant Professor at MSU-IIT · Head of PCETT · AI READY ASEAN Master Trainer"; links "Academic work" and "CV".
- Academic: h1 "Academic work"; role line; Research interests (from old research page directions: connected environments, AI & society, policy & futures — one line each); Publications (`publications.ts`, DOI links); Conference presentation; Teaching (courses list); Policy & engagements (PCETT role, AI Ready ASEAN convening, ASEAN AHEAD training — from `profile.engagements`); Google Scholar + CV links. Plain, no animation.
- CV: keep printable page and print button; restyle with site.css; update contact email.
- 404: h1 "Nothing here." + links home/work.
- [ ] **Failing tests:** academic page contains both DOIs and "PCETT"; about contains "Jom" and no "Jomari"; cv has `id="print-profile"`; 404 has one h1.
- [ ] Implement → verify → commit "Add about, academic, CV, and 404 pages".

### Task 8: Docs and housekeeping (batch, lead)

- README: describe the new site, `npm run import:n8n <dir>`, deploy notes; CHANGELOG `## [2.0.0]`; `docs/content-sources.md` add n8n workflows source + data-hygiene rule; delete obsolete `docs/superpowers/plans/2026-10-11-portfolio-redesign.md`? No — keep history.
- Commit "Update docs for v2".

### Task 9: QA

- [ ] Update `scripts/browser-check.mjs` routes: `''`, `work/`, all 8 `work/<slug>/`, `about/`, `academic/`, `cv/`. Add checks: reduced-motion → no element with running animation (`document.getAnimations().length === 0` after load), terminal shows final state.
- [ ] Full run: format:check, check, lint, `BASE_PATH=/personal-portfolio/ npm run build`, `npm test`, preview + `BROWSER_CHANNEL=chrome PREVIEW_URL=http://localhost:4321/personal-portfolio/ npm run test:browser`. All PASS.
- [ ] Final whole-branch review (most capable model) vs spec + Global Constraints.
- [ ] Lead visual check at 375/768/1440 against the mockup.
- [ ] Owner review in the browser; deploy only on explicit OK (merge `redesign` → `master`, push).
