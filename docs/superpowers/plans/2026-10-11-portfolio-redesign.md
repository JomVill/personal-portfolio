# Portfolio Redesign ("Field instrument") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reposition the Astro portfolio around AI automation (lead) with separate Research, Policy, and Teaching channels, in a "field instrument" visual language and a curious-tinkerer voice.

**Architecture:** Static Astro site, no client framework. Content is data-driven (`src/data/*.ts`, content collections). A shared design system (tokens + small components) is built once by the lead; page tasks are then parallelized to subagents, each owning its own page and data file.

**Tech Stack:** Astro 7, TypeScript, plain CSS, node:test, Playwright + axe (browser check), Prettier + prettier-plugin-astro.

**Spec:** `docs/superpowers/specs/2026-10-11-portfolio-redesign-design.md`

## Global Constraints

- Node >= 22.12; deploy target GitHub Pages at base `/personal-portfolio/`; all internal URLs go through `path()` from `src/lib/paths.ts`.
- No client framework, no external scripts, no analytics, no contact form, no CMS, no i18n.
- Voice: first person, plain, specific, a little playful; no "revolutionary", "leverage", "cutting-edge", "synergy", "passionate". Short sentences.
- Honesty: never invent clients, metrics, outcomes, dates, or quotes. Missing owner input renders through `<Placeholder>`, never made-up text.
- Channels: CH1 Automation, CH2 Research, CH3 Policy, CH4 Teaching. Policy is separate from university teaching/research.
- Channel colors are for labels, traces, status lights only — never large fills.
- Every decorative element must carry information (a real coordinate, date, channel, status). Pure gimmicks get cut.
- WCAG 2.1 AA (axe clean), works at 375px wide and at 200% root font size with no horizontal scroll, `prefers-reduced-motion` respected, CV prints.
- Exactly one `<h1>` per page; `<html lang="en">`.
- Owner location readout: `8.23°N 124.24°E · ILIGAN CITY, PH`.

## Review Focus

1. **Project base path** — site built with `BASE_PATH=/personal-portfolio/` must have every internal link and asset resolve (existing `tests/static.test.mjs`; every task's verification runs with that base).
2. **Old `/writing/` URLs** — anyone with an old link lands on `/logs/` (Task 7 test).
3. **JavaScript disabled** — the homepage automation showcase shows the first workflow fully as server-rendered HTML (Task 5 test).
4. **Zero build logs published** — `/logs/` shows an empty state, not a blank page or build error (Task 7 test).
5. **Placeholders leaking as real content** — every placeholder is wrapped in `[data-placeholder]` and counted; build passes but `npm run report:placeholders` lists them so nothing ships silently (Task 2 test).

## File Structure

```
src/
  data/
    channels.ts        (T2) channel registry — single source of channel ids/names/colors
    profile.ts         (T2) + bench[], personal[] ; existing exports kept
    automation.ts      (T6) public automation workflows
    projects.ts        (T2) + channel field on each project
    policy.ts          (T8) policy engagements
  components/
    Placeholder.astro  (T2)
    ChannelTag.astro   (T4)
    ChannelHeader.astro(T4)
    Readout.astro      (T4)
    StatusLight.astro  (T4)
    LogEntry.astro     (T4)
    Header.astro       (T4) new nav
    Footer.astro       (T4)
  styles/
    tokens.css         (T4) colors, type, spacing, channel colors
    base.css           (T4) reset, typography, layout (.wrap, .section, .page-intro)
    components.css     (T4) shared component styles
    pages/*.css        (T5–T9) one file per page, owned by that page's task
  content.config.ts    (T7) logs collection
  content/logs/        (T7)
  pages/
    index.astro        (T5)
    automation.astro   (T6)
    logs/index.astro, logs/[...slug].astro (T7)
    research.astro     (T8)  policy.astro (T8)
    teaching.astro     (T9)  about.astro (T9)  cv.astro (T9)
tests/
  static.test.mjs      existing
  site.test.mjs        (T2+) new structural tests, extended by each task
docs/voice.md          (T2)
docs/mockups/          (T3)
```

## Agent briefing template (used for every subagent dispatch)

Paste this, filled in, as the subagent prompt:

```
You are implementing Task <N> of docs/superpowers/plans/2026-10-11-portfolio-redesign.md
in /Users/jomvill/Developer/Personal/Personal Portfolio (branch: redesign).
Read first, in order: the spec (docs/superpowers/specs/2026-10-11-portfolio-redesign-design.md),
docs/voice.md, the "Global Constraints" section of the plan, then Task <N> only.
Visual reference: docs/mockups/<chosen>.html (match its look; do not copy its markup blindly).
You own ONLY these files: <list>. Do not edit any other file. If you need a change
elsewhere, stop and report it.
Use existing components from src/components/ and tokens from src/styles/tokens.css;
do not add new colors or fonts.
Follow the task steps exactly, including the failing test first.
Done = all task tests pass, then: BASE_PATH=/personal-portfolio/ npm run build && npm test
&& npm run check && npm run lint all pass. Commit with the message given in the task.
Report: files changed, test output summary, any placeholder you added and why, anything you
were unsure about.
```

---

### Task 1: Groundwork (lead)

**Files:**

- Modify: `.github/workflows/deploy.yml`, `package.json`, `README.md`
- Create: `.prettierrc.json`, `.prettierignore`
- Delete: `src/assets/ai-workflow.png`, `src/assets/environmental-sensor.png` (unreferenced)
- Commit already-made fixes: `scripts/browser-check.mjs`, `src/styles/global.css`, `CHANGELOG.md`

- [ ] **Step 1: Commit pending fixes**

```bash
git add scripts/browser-check.mjs src/styles/global.css CHANGELOG.md
git commit -m "Fix browser check context and mobile heading overflow; add changelog"
```

- [ ] **Step 2: Add formatter**

```bash
npm i -D --save-exact prettier prettier-plugin-astro
```

`.prettierrc.json`:

```json
{
  "plugins": ["prettier-plugin-astro"],
  "singleQuote": true,
  "printWidth": 110,
  "overrides": [{ "files": "*.astro", "options": { "parser": "astro" } }]
}
```

`.prettierignore`:

```
dist
.astro
node_modules
test-results
package-lock.json
```

`package.json` scripts — add:

```json
"format": "prettier --write .",
"format:check": "prettier --check .",
"test:browser": "node scripts/browser-check.mjs",
"report:placeholders": "node scripts/report-placeholders.mjs"
```

- [ ] **Step 3: Format the codebase and verify nothing changed in output**

```bash
BASE_PATH=/personal-portfolio/ npm run build && cp -r dist /tmp/claude-501/dist-before
npm run format
BASE_PATH=/personal-portfolio/ npm run build && diff -r /tmp/claude-501/dist-before dist
```

Expected: diff shows only whitespace differences inside HTML (or none). If any text content differs, revert and inspect.

- [ ] **Step 4: Deploy trigger + README**

In `deploy.yml` change `branches: [main]` to `branches: [master]`, add `- run: npm run format:check` after `npm run lint`. In README replace the "workspace had no configured Git remote" paragraph with: `Repository: JomVill/personal-portfolio → https://jomvill.github.io/personal-portfolio/`. Replace `/portfolio/` examples with `/personal-portfolio/`. Document `BROWSER_CHANNEL=chrome npm run test:browser`.

- [ ] **Step 5: Remove unused assets, verify, commit**

```bash
git rm src/assets/ai-workflow.png src/assets/environmental-sensor.png
npm run check && npm run lint && npm run format:check && BASE_PATH=/personal-portfolio/ npm run build && npm test
git add -A && git commit -m "Add Prettier, format codebase, fix deploy branch, update README"
```

---

### Task 2: Content model, voice guide, placeholders (lead)

**Files:**

- Create: `docs/voice.md`, `src/data/channels.ts`, `src/components/Placeholder.astro`, `scripts/report-placeholders.mjs`, `tests/site.test.mjs`
- Modify: `src/data/projects.ts` (add `channel`), `src/data/profile.ts` (add `bench`, `personal`)

**Interfaces:**

- Produces:
  - `type ChannelId = 'automation' | 'research' | 'policy' | 'teaching'`
  - `channels: { id: ChannelId; code: 'CH1'|'CH2'|'CH3'|'CH4'; name: string; route: string; blurb: string }[]` (order CH1..CH4)
  - `channelById(id: ChannelId)` → channel
  - `<Placeholder need="..." />` renders `<span class="placeholder" data-placeholder>[Needs input: {need}]</span>`
  - `bench: { title: string; note: string }[]`, `personal: string[]` in profile.ts (empty arrays allowed)
  - each project has `channel: ChannelId`
  - `tests/site.test.mjs` exports nothing; helper `readPage(route)` reads `dist/<route>index.html`

- [ ] **Step 1: Write failing test** — `tests/site.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
export const readPage = (route) => readFile(join('dist', route, 'index.html'), 'utf8');

test('placeholders are always marked', async () => {
  const html = await readPage('');
  for (const m of html.matchAll(/\[Needs input:/g)) {
    const before = html.slice(Math.max(0, m.index - 200), m.index);
    assert.match(before, /data-placeholder/, 'unmarked placeholder text');
  }
});
```

Also add a node test importing data directly isn't possible from .ts without a loader — instead check in Step 3 via `astro check`.

- [ ] **Step 2: Run** `BASE_PATH=/personal-portfolio/ npm run build && npm test` — expected PASS (no placeholders yet; test guards future tasks).

- [ ] **Step 3: Implement**

`src/data/channels.ts`:

```ts
export type ChannelId = 'automation' | 'research' | 'policy' | 'teaching';
export const channels = [
  {
    id: 'automation',
    code: 'CH1',
    name: 'Automation',
    route: 'automation/',
    blurb: 'AI workflows and agents I build for real work.',
  },
  {
    id: 'research',
    code: 'CH2',
    name: 'Research',
    route: 'research/',
    blurb: 'Societal computing: how sensing and AI land in communities.',
  },
  {
    id: 'policy',
    code: 'CH3',
    name: 'Policy',
    route: 'policy/',
    blurb: 'Helping institutions decide how to adopt technology.',
  },
  {
    id: 'teaching',
    code: 'CH4',
    name: 'Teaching',
    route: 'teaching/',
    blurb: 'Computing courses and AI literacy training.',
  },
] as const satisfies readonly { id: ChannelId; code: string; name: string; route: string; blurb: string }[];
export const channelById = (id: ChannelId) => channels.find((c) => c.id === id)!;
```

`src/components/Placeholder.astro`:

```astro
---
interface Props {
  need: string;
}
const { need } = Astro.props;
---

<span class="placeholder" data-placeholder>
  [Needs input: {need}]
</span>
```

`scripts/report-placeholders.mjs`:

```js
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
async function walk(d) {
  return (
    await Promise.all(
      (await readdir(d, { withFileTypes: true })).map((e) =>
        e.isDirectory() ? walk(join(d, e.name)) : join(d, e.name),
      ),
    )
  ).flat();
}
let total = 0;
for (const f of (await walk('dist')).filter((f) => f.endsWith('.html'))) {
  const hits = [...(await readFile(f, 'utf8')).matchAll(/\[Needs input: ([^\]]+)\]/g)].map((m) => m[1]);
  if (hits.length) {
    total += hits.length;
    console.log(f, '\n  - ' + hits.join('\n  - '));
  }
}
console.log(`${total} placeholder(s)`);
```

Projects channels: `applied-ai` → `automation`, `ai-literacy-policy` → `teaching`, `digital-government` → `policy`, `environmental-sensing` → `research`. Also fix duplicated text: `digital-government.result` = `'The plan is the city’s roadmap for information systems. Implementation status is not documented here.'`
In `profile.ts` add `export const bench: { title: string; note: string }[] = [];` and `export const personal: string[] = [];` (filled from owner input when supplied).

`docs/voice.md` — write: the one-line story, the voice rules from Global Constraints, 3 do/don't pairs:

- Do: "I wired a research agent to our content calendar. It saved hours; it also invented a source once, so now a human checks every citation." Don't: "Leveraging cutting-edge AI to revolutionize content."
- Do: "I teach IoT by making students break sensors first." Don't: "Passionate educator committed to excellence."
- Do: "PCETT helps the city decide what to build before buying it." Don't: "Driving digital transformation synergies."
  Note: examples illustrate tone only — never publish them as facts.

- [ ] **Step 4: Verify** `npm run check && npm run lint && BASE_PATH=/personal-portfolio/ npm run build && npm test` — all PASS.
- [ ] **Step 5: Commit** `git add -A && git commit -m "Add channel model, voice guide, placeholder component"`

---

### Task 3: Design exploration — 3 homepage mockups (3 parallel subagents, then OWNER CHECKPOINT)

**Files:** Create `docs/mockups/a-logger.html`, `docs/mockups/b-notebook.html`, `docs/mockups/c-scope.html` (one per agent; static single-file HTML, inline CSS, no external requests except Google Fonts allowed for mockups only).

Each agent gets the briefing template plus this:

```
Make ONE static homepage mockup at 1440px and 375px (responsive, single HTML file).
Content (use exactly): headline "I build AI systems — and study how they land in society."
sub "I'm Jomari. I wire up workflows, sensors, and classrooms in Iligan City."
readout "8.23°N 124.24°E · ILIGAN CITY, PH"; four channels from src/data/channels.ts with
their blurbs; an automation showcase panel showing workflow "Research → AI workflow → Content"
(captions: Gather context / Connect & create / Ready for review); an "On the bench" strip with
two [Needs input] items; latest log card with [Needs input].
Palette base: paper #f8f8f5, ink #252623, muted #696b64, signal orange #ee652b (accent text #ad3b0f).
Channel colors (text on paper must hit 4.5:1): CH1 #b33d0b, CH2 #1d6b85, CH3 #6d4aa8, CH4 #2e7539.
Direction for your variant:
  A "Logger": multi-channel data logger. Four horizontal channel traces across the page,
    each a live-looking line in its channel color with ID + status LED. Hardware bezel for showcase.
  B "Notebook": field survey notebook. Graph-paper grid, hand-annotated feel via mono labels,
    taped-in instrument panel for showcase, channels as tabbed notebook dividers.
  C "Scope": oscilloscope front panel. Dark display window for showcase and readouts,
    channel buttons CH1–CH4 as physical keys, light chassis around it (TE-adjacent but not TE).
Must: be distinctive, not a Teenage Engineering clone; decoration carries information;
readable at 375px; no horizontal scroll. Do not touch any file outside your mockup.
Report a 2-sentence rationale.
```

- [ ] **Step 1:** Dispatch 3 agents in parallel (one per variant).
- [ ] **Step 2:** Lead screenshots each at 1440 and 375 (Playwright, `BROWSER_CHANNEL=chrome`) and checks contrast of channel label text.
- [ ] **Step 3: OWNER CHECKPOINT** — publish the three mockups side-by-side for the owner; owner picks one (or a mix). Record the choice and any notes at the top of `docs/voice.md` under `## Chosen visual direction`.
- [ ] **Step 4: Commit** `git add docs && git commit -m "Add homepage mockups and record chosen direction"`

---

### Task 4: Design system + shell (lead)

**Files:**

- Create: `src/styles/tokens.css`, `src/styles/base.css`, `src/styles/components.css`, `src/components/{ChannelTag,ChannelHeader,Readout,StatusLight,LogEntry}.astro`
- Modify: `src/layouts/Layout.astro` (import new CSS instead of global.css), `src/components/Header.astro`, `src/components/Footer.astro`
- Delete: `src/styles/global.css` after its still-needed rules move into base/components or per-page files

**Interfaces:**

- Consumes: `channels`, `ChannelId`, `channelById` (T2)
- Produces:
  - CSS vars: `--paper --ink --muted --accent --signal --line --ch-automation --ch-research --ch-policy --ch-teaching --heading --body --mono`, plus spacing `--s1..--s6`
  - `<ChannelTag channel={ChannelId} />` → `<span class="channel-tag" data-channel={id}>CH1 · Automation</span>`
  - `<ChannelHeader channel={ChannelId} title="..." intro="..." />` → page intro block with the page's single `<h1>`, `data-channel` on root
  - `<Readout label="..." value="..." />` → `<span class="readout"><span>{label}</span> {value}</span>`
  - `<StatusLight state="live"|"idle"|"done" label="..." />` (label is visually hidden text)
  - `<LogEntry title date(Date) description href channel? />` → `<article class="log-entry">` with `<time datetime>`
  - Header nav order: Automation, Research, Policy, Teaching, Logs, About; `aria-current="page"` on active; CTA "Email me" (mailto)
  - Per-page CSS: each page imports `../styles/pages/<page>.css` in its frontmatter

- [ ] **Step 1: Failing test** — append to `tests/site.test.mjs`:

```js
test('header nav lists channels in order on every page', async () => {
  const html = await readPage('');
  const nav = html.match(/<nav[^>]*aria-label="Main navigation"[^>]*>([\s\S]*?)<\/nav>/)[1];
  const labels = [...nav.matchAll(/>([^<>]+)<\/a>/g)].map((m) => m[1].trim());
  assert.deepEqual(labels.slice(0, 6), ['Automation', 'Research', 'Policy', 'Teaching', 'Logs', 'About']);
});
```

- [ ] **Step 2:** Run build + test → FAIL (old nav).
- [ ] **Step 3:** Implement tokens/components/header/footer per chosen mockup. Channel colors from Task 3 brief. Footer: email CTA, socials, CV, Readout with location.
- [ ] **Step 4:** Build + `npm test` PASS; `npm run check && npm run lint && npm run format:check` PASS; preview + `BROWSER_CHANNEL=chrome PREVIEW_URL=http://localhost:4321/personal-portfolio/ npm run test:browser` PASS for existing routes (route list still old; update in T10).
- [ ] **Step 5: Commit** `git commit -am "Add field-instrument design system, components, and new navigation"`

---

### Tasks 5–9: Pages (5 parallel subagents after Task 4 merges)

Each agent owns only its listed files. Shared data/components are read-only for them.

### Task 5: Homepage (subagent)

**Files:** Modify `src/pages/index.astro`; Create `src/styles/pages/home.css`; Test: `tests/site.test.mjs` (append — coordinate: lead merges test appends from Tasks 5–9)

**Interfaces:** Consumes `channels`, `ChannelTag`, `Readout`, `StatusLight`, `LogEntry`, `bench`, logs collection (`getCollection('logs')`, may be empty — Task 7 creates it; until merged, guard with try/catch → `[]`). Showcase workflows: reuse the existing `workflows` array in index.astro, retitled per voice.md.

Sections in order: hero (headline + sub from Task 3 brief, location Readout) → automation showcase instrument (existing tab logic kept: arrow keys, Home/End, reduced motion) → four channel cards linking to `path(channel.route)` → "On the bench" (`bench` items, or one `<Placeholder need="what you're tinkering with now" />` if empty) → latest log (or nothing if none).

- [ ] **Step 1: Failing tests**

```js
test('home: showcase works without JS and links all channels', async () => {
  const html = await readPage('');
  assert.match(html, /id="workflow-title"[^>]*>[^<]+</, 'first workflow server-rendered');
  for (const r of ['automation/', 'research/', 'policy/', 'teaching/'])
    assert.ok(html.includes(`/personal-portfolio/${r}"`), r);
  assert.match(html, /8\.23°N 124\.24°E/);
});
```

- [ ] **Step 2:** build + test → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** build + test + check + lint + format:check PASS.
- [ ] **Step 5:** `git commit -m "Redesign homepage around automation showcase and channels"`

### Task 6: Automation page (subagent)

**Files:** Create `src/pages/automation.astro`, `src/data/automation.ts`, `src/styles/pages/automation.css`

**Interfaces:** Produces `automationWorkflows: { slug: string; title: string; input: string; ai: string; output: string; tools: string[]; status: 'public' | 'needs-input'; link?: string }[]`. Seed with ONLY documented items: Faculty DTR generator (`link: 'https://github.com/JomVill/fdtr-generator'`, tools from its README), and the Future AI Lab content workflow described generically from `projects.ts` (`status: 'public'`, no client names). Add 2 entries with `status: 'needs-input'` rendered via `<Placeholder need="public automation workflow #N: input, AI step, output, tools" />`.

Page: `ChannelHeader channel="automation"` → workflows as input→AI→output rows → "Stack" list (Zapier, n8n, APIs, LLMs, AI agent workflows, Claude Code, Codex — from cv.astro) → "How I work" 3 short steps (map, prototype, hand over; voice.md tone, no promises of outcomes) → CTA mailto.

- [ ] **Step 1: Failing test**

```js
test('automation page has workflows and a mailto CTA', async () => {
  const html = await readPage('automation/');
  assert.match(html, /data-channel="automation"/);
  assert.ok((html.match(/class="workflow-row/g) || []).length >= 2);
  assert.match(html, /href="mailto:/);
});
```

- [ ] **Steps 2–5:** fail → implement → pass (+check/lint/format) → `git commit -m "Add automation channel page"`

### Task 7: Logs collection + redirect (subagent)

**Files:** Modify `src/content.config.ts`; Create `src/content/logs/.gitkeep`, `src/pages/logs/index.astro`, `src/pages/logs/[...slug].astro`, `src/styles/pages/logs.css`; Delete `src/pages/writing/`, `src/content/writing/`; Modify `astro.config.mjs` (add `redirects: { '/writing/': '/logs/' }` — Astro prefixes base automatically; verify in dist).

**Interfaces:** Produces collection `logs` with schema `{ title: string; description: string; date: Date; draft: boolean (default true); channel?: ChannelId; tags: string[] }`. Index lists non-draft newest first using `LogEntry`; empty state: "Nothing logged yet. The bench is busy." + link to `/automation/`.

- [ ] **Step 1: Failing tests**

```js
test('logs: empty state and writing redirect', async () => {
  const logs = await readPage('logs/');
  assert.match(logs, /Nothing logged yet/);
  const old = await readPage('writing/');
  assert.match(old, /\/personal-portfolio\/logs\//);
});
```

- [ ] **Steps 2–5:** fail → implement → pass → `git commit -m "Replace writing with build logs and redirect old URL"`

### Task 8: Research + Policy pages (subagent)

**Files:** Modify `src/pages/research.astro`; Create `src/pages/policy.astro`, `src/data/policy.ts`, `src/styles/pages/research.css`, `src/styles/pages/policy.css`

**Interfaces:** Produces `policyItems: { title: string; date: string; role: string; text: string; url?: string }[]` built ONLY from: the AI Ready ASEAN convening (profile.engagements[0]), Iligan ISSP (projects `digital-government`), Head of PCETT role (profile.experience[1]). Research keeps `publications`, `presentations`; removes policy engagements (they move to Policy).

Research page: `ChannelHeader channel="research"` → "Research direction: societal computing" statement (3 short paragraphs framing existing work — LoRa PM2.5 sensing, AIoT boarding-house security, AI literacy — as how computing lands in communities; end with `<Placeholder need="PhD focus question and target timing" />`) → publications → presentations → Google Scholar link.

Policy page: `ChannelHeader channel="policy"` → what PCETT does (from profile.experience[1].detail) → policy items → link to research and teaching.

- [ ] **Step 1: Failing tests**

```js
test('research and policy are separate channels', async () => {
  const r = await readPage('research/'),
    p = await readPage('policy/');
  assert.match(r, /data-channel="research"/);
  assert.match(r, /[Ss]ocietal computing/);
  assert.match(r, /10\.1109\/ACDSA67686\.2026\.11468017/);
  assert.match(p, /data-channel="policy"/);
  assert.match(p, /Information Systems Strategic Plan/);
  assert.doesNotMatch(r, /National Policy Convening/);
});
```

- [ ] **Steps 2–5:** fail → implement → pass → `git commit -m "Add policy channel and societal computing research page"`

### Task 9: Teaching, About, CV (subagent)

**Files:** Modify `src/pages/teaching.astro`, `src/pages/about.astro`, `src/pages/cv.astro`; Create `src/styles/pages/teaching.css`, `src/styles/pages/about.css`, `src/styles/pages/cv.css`

Teaching: `ChannelHeader channel="teaching"` → courses → AI READY ASEAN Master Trainer + ASEAN AHEAD training (profile.engagements[1]); remove policy convening from this page. About: tinkerer intro in voice.md tone → "How it connects" (the four channels, one line each) → "Outside the lab": `personal` items or `<Placeholder need="2–3 personal details" />` → links. CV: same data, restyled; print button and print CSS kept working; add Policy section header using experience[1].

- [ ] **Step 1: Failing tests**

```js
test('teaching, about, cv', async () => {
  const t = await readPage('teaching/'),
    a = await readPage('about/'),
    c = await readPage('cv/');
  assert.match(t, /data-channel="teaching"/);
  assert.doesNotMatch(t, /National Policy Convening/);
  assert.match(a, /Outside the lab/);
  assert.match(c, /id="print-profile"/);
});
```

- [ ] **Steps 2–5:** fail → implement → pass → `git commit -m "Restyle teaching, about, and CV pages"`

---

### Task 10: Integration QA (lead + 1 review subagent)

**Files:** Modify `scripts/browser-check.mjs` (route list), `src/pages/work/*` (add `ChannelTag`, restyle), `docs/content-sources.md` (add any new sources), `CHANGELOG.md`

- [ ] **Step 1:** Update browser-check route list to `['', 'automation/', 'research/', 'policy/', 'teaching/', 'logs/', 'about/', 'cv/', 'work/', 'work/applied-ai/', 'work/ai-literacy-policy/', 'work/digital-government/', 'work/environmental-sensing/']`.
- [ ] **Step 2:** Add `ChannelTag` to work cards and case-study pages; restyle with tokens.
- [ ] **Step 3:** Full run: `npm run format:check && npm run check && npm run lint && BASE_PATH=/personal-portfolio/ npm run build && npm test && npm run report:placeholders`, then preview and `BROWSER_CHANNEL=chrome PREVIEW_URL=http://localhost:4321/personal-portfolio/ npm run test:browser`. All PASS.
- [ ] **Step 4:** Dispatch review subagent (superpowers:requesting-code-review) on the whole `redesign` branch vs `master`, with the spec + Global Constraints as the checklist; specifically check voice rules, honesty (no invented facts vs `docs/content-sources.md`), channel separation, contrast.
- [ ] **Step 5:** Lead visual review at 375/768/1440 in the browser pane; fix issues.
- [ ] **Step 6:** CHANGELOG `## [2.0.0]` entry; `git commit -am "QA pass for redesign"`.

### Task 11: Owner review + deploy (OWNER CHECKPOINT)

- [ ] **Step 1:** Run dev server; owner reviews. List remaining placeholders from `npm run report:placeholders`.
- [ ] **Step 2:** Apply owner content inputs; re-run Task 10 Step 3.
- [ ] **Step 3:** With owner's explicit OK: merge `redesign` into `master`, `git push origin master`; owner sets Settings → Pages → Source = GitHub Actions; confirm the Actions run and live URL `https://jomvill.github.io/personal-portfolio/`.

## Checklist (summary)

- [ ] T1 Groundwork — formatter, deploy branch, README, cleanup
- [ ] T2 Content model, voice guide, placeholders
- [ ] T3 Three mockups → **owner picks**
- [ ] T4 Design system + header/footer
- [ ] T5 Home · T6 Automation · T7 Logs · T8 Research+Policy · T9 Teaching/About/CV (parallel agents)
- [ ] T10 Integration QA + review agent
- [ ] T11 **Owner review**, content fill, deploy
