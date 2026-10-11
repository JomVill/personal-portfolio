# Portfolio redesign — "Field instrument"

Date: 2026-10-11 · Status: draft for owner review

## Goal

Reposition the portfolio so it wins **AI automation work** (clients/employers) first, while staying credible to **MSU-IIT** and to **societal computing PhD committees**. Show the owner's personality: the **curious tinkerer**.

Success: a visitor understands within one screen that Jomari builds AI automation systems; within one click they can reach clearly separate Research, Policy, and Teaching areas; a PhD reader finds a coherent societal-computing research direction.

## Positioning

One-line story: **"I build AI systems — and study and shape how they land in society."**

| Channel        | Audience                      | Role in story                                                                       |
| -------------- | ----------------------------- | ----------------------------------------------------------------------------------- |
| CH1 Automation | Clients, employers            | Lead. What he builds.                                                               |
| CH2 Research   | PhD committees, collaborators | Societal computing: sensing, AIoT, communities.                                     |
| CH3 Policy     | Government, uni               | PCETT, Iligan ISSP, AI Ready ASEAN convenings. Separate from uni teaching/research. |
| CH4 Teaching   | Uni, training partners        | MSU-IIT courses, AI READY ASEAN Master Trainer.                                     |

## Voice

Curious tinkerer: first person, plain, specific, a little playful. Shows how things work and what broke. No hype words ("revolutionary", "leverage", "cutting-edge"). Short sentences. Honest: no invented clients, metrics, or outcomes (existing `docs/content-sources.md` rule stays).

## Visual direction

**Revised 2026-10-11 after owner review of mockups:** the field-instrument mockups were too busy, and the oscilloscope theme does not fit the owner. Direction is now **"career as an automation workflow"**, calm and minimal.

- Homepage centrepiece: the owner's career drawn as an automation-workflow canvas (n8n/Zapier-like). Each role, degree, or milestone is a node, connected chronologically, with parallel branches where roles overlapped, ending in a "next: PhD" node. Clicking or focusing a node shows its details.
- Calm: generous whitespace, few elements per screen, no textures, no live clocks, no gimmicks.
- Warm off-white + charcoal base; orange is the single accent (the active connection or node).
- Channel colors appear only as small tags on nodes (Automation, Research, Policy, Teaching), so the four areas stay distinguishable.
- Monospace only for small labels (dates, node types).
- Build logs: simple dated list.
- Must pass WCAG 2.1 AA, reduced motion, 375px width (the workflow stacks vertically), print CV.

One mockup is built in this direction for owner approval (plan Task 3).

## Information architecture

- `/` Home — headline, automation showcase instrument, four channel entry points, "on the bench now" strip, latest build log.
- `/automation/` — workflows/projects built, stack, how to work with him, contact CTA.
- `/research/` — societal computing research statement, publications, presentations, directions.
- `/policy/` — PCETT, ISSP, convenings, policy engagements.
- `/teaching/` — courses, AI READY ASEAN training.
- `/logs/` + `/logs/<slug>/` — build logs (replaces `/writing/`; redirect old path).
- `/about/` — personality, background, "outside the lab".
- `/cv/` — printable, unchanged in function.
- `/work/<slug>/` — case studies kept; each tagged with a channel.

Nav: Automation · Research · Policy · Teaching · Logs · About. Contact = mailto CTA.

## Architecture

Static Astro, no client framework (unchanged). Data-driven:

- `src/data/channels.ts` — channel id, name, color token, blurb.
- Projects/engagements gain a `channel` field.
- `src/content/logs/` collection replaces `writing`.
- Shared components: `ChannelTag`, `Readout`, `StatusLight`, `LogEntry`, `ChannelHeader`.
- CSS reformatted into readable files; tokens in one place.

## Testing

Existing `npm run check`, `lint`, `build`, `test`, and `scripts/browser-check.mjs` (route list updated). Plus a review agent pass and visual review at 375/768/1440.

## Owner inputs required

1. 2–4 automation workflows that can be shown publicly (what goes in, what the AI does, what comes out, tools).
2. 2–3 personal details (hobby, habit, how a friend describes him).
3. What's on the bench now (1–3 items).
4. PhD timing and target programs/regions (optional, shapes research page).
5. 1–2 seed build-log topics.

Missing inputs ship as clearly marked TODO content in drafts, never invented.

## Out of scope

Contact form, analytics, CMS, blog comments, i18n, custom domain.
