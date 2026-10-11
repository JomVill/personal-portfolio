# Portfolio redesign — AI automation portfolio

Date: 2026-10-11 · Status: v3, approved direction (owner chose "pure AI automation portfolio", option A)

History: v1 "field instrument" (four channels) and v2 "career as workflow" were rejected by the owner as too busy / not him. Mockups a–d stay in `docs/mockups/` for reference only.

## Goal

A focused portfolio that gets Jomari hired for **AI automation work**. Nothing else leads. Academic roles appear only as a one-line credibility note on About.

Success: within one screen a visitor knows he builds AI automations in n8n; within one click they see real workflows he built; contacting him takes one click.

Assumed audience: small and medium businesses and operations teams (sales, finance, HR, content). Owner may correct.

## Content source

The owner's local n8n instance. Eight workflows (all built in n8n, inactive, last saved 2026-10-10):

1. Partnership Operations Automation — featured
2. Shift Timesheet Reminders + AI Validation
3. Article to Social Content
4. AI Email Classifier
5. Google Form to HubSpot with $10 Link and $1000 Contract
6. Create Invoice from HubSpot to QuickBooks
7. Slack Message to ClickUp
8. Set a Meeting via Slack

Excluded: the Faculty DTR generator (owner instruction), research/policy/teaching content, PhD material.

Honesty rules: describe these as "workflows I built"; no client names, deployments, metrics, or outcomes unless the owner supplies them. Missing owner input renders as a visible placeholder, never invented text.

Data hygiene: the site stores only a sanitized extract per workflow (name, node names, node types, node positions, connections, plain-language summary). Never credentials, credential names, IDs, webhook paths, emails, channel/list IDs, or prompts.

## Voice

First person, plain, specific, a little playful. Short sentences. No "revolutionary", "leverage", "cutting-edge", "synergy", "passionate", "seamless".

## Visual direction

Minimal. Lots of whitespace, one accent color (orange), charcoal on warm off-white, Manrope + DM Sans. No decorative elements. The only graphics are **simplified drawings of the real n8n workflows**, rendered at build time as SVG from the sanitized node positions and connections (nodes as rounded boxes, AI steps marked with the accent, a human-approval step marked distinctly). Must pass WCAG 2.1 AA, reduced motion, 375px width with no horizontal scroll.

## Pages

- `/` Home: headline about what he automates + one line about him → featured workflow (drawing + 3-line plain explanation: trigger, what AI does, where a human checks, outcome) → 3–4 other workflow cards → tools (n8n, OpenAI/LLM agents, HubSpot, Slack, Gmail, QuickBooks, ClickUp, Trello…, only those actually used) → how I work (3 steps) → contact button.
- `/work/` all 8 workflows; `/work/<slug>/` per workflow: problem, how it runs (drawing + step list), tools, where the human stays in the loop.
- `/about/` short personal intro, one credibility line (Assistant Professor at MSU-IIT · Head of PCETT · AI READY ASEAN Master Trainer · ex-Head of Technology & Research, Future AI Lab), CV link.
- Contact: mailto link (header + footer + home).

Removed: research, policy, teaching, writing/logs pages; old `/work/<old-slug>/` case studies. Old URLs (`/research/`, `/teaching/`, `/writing/`, `/cv/` if removed, old work slugs) redirect to the closest new page.

## Architecture

Static Astro, no client framework. `scripts/import-n8n.mjs` reads exported workflow JSON from a local folder (not committed) and writes sanitized `src/data/workflows.json`. A `WorkflowDiagram.astro` component renders the SVG. Existing tests and browser check are updated to the new routes.

## Out of scope

Contact form, analytics, CMS, blog, publishing workflow JSON files, live n8n embedding.
