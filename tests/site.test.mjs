import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const readPage = (route) => readFile(join('dist', route, 'index.html'), 'utf8');

const home = await readFile('dist/index.html', 'utf8');
const STORY_SCOUT = 'content-pipeline-1-daily-story-scout-score-and-vote';
export const base = new URL(home.match(/rel="canonical" href="([^"]+)"/)[1]).pathname;

test('placeholders are always marked', async () => {
  const html = await readPage('');
  for (const m of html.matchAll(/\[Needs input:/g)) {
    const before = html.slice(Math.max(0, m.index - 200), m.index);
    assert.match(before, /data-placeholder/, 'unmarked placeholder text');
  }
});

test('workflows.json is sanitized', async () => {
  const raw = await readFile('src/data/workflows.json', 'utf8');
  for (const bad of ['credential', 'webhookId', 'apiKey', '@', 'parameters'])
    assert.ok(!raw.includes(bad), bad);
  const data = JSON.parse(raw);
  assert.equal(data.length, 12);
  const values = [];
  const walk = (v) => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
    else values.push(String(v));
  };
  walk(data);
  for (const v of values) assert.doesNotMatch(v, /^[A-Za-z0-9]{16}$/, 'n8n-style id');
  for (const w of data) {
    for (const k of Object.keys(w)) assert.ok(['id', 'name', 'nodes', 'edges'].includes(k), k);
    for (const n of w.nodes) assert.deepEqual(Object.keys(n).sort(), ['name', 'position', 'type']);
    for (const e of w.edges) assert.deepEqual(Object.keys(e).sort(), ['from', 'kind', 'to']);
  }
});

test('workflow copy keys match workflow ids', async () => {
  const data = JSON.parse(await readFile('src/data/workflows.json', 'utf8'));
  const copy = await readFile('src/data/workflow-copy.ts', 'utf8');
  const keys = [...copy.matchAll(/^ {2}'([a-z0-9-]+)': \{/gm)].map((m) => m[1]);
  assert.deepEqual([...keys].sort(), data.map((w) => w.id).sort());
  // exactly one featured workflow, and it is Story Scout
  const featuredKeys = keys.filter((k) => {
    const block = copy.slice(copy.indexOf(`'${k}': {`)).split(/^ {2}'/m)[0];
    return /^ {4}featured: true,/m.test(block);
  });
  assert.deepEqual(featuredKeys, [STORY_SCOUT]);
  // every featured-capable mainPath names real nodes and has 10 steps
  for (const id of [STORY_SCOUT, 'partnership-operations-automation']) {
    const w = data.find((x) => x.id === id);
    const names = new Set(w.nodes.map((n) => n.name));
    const block = copy.slice(copy.indexOf(`'${id}': {`));
    const path = block.match(/mainPath: \[([^\]]+)\]/)[1];
    const steps = [...path.matchAll(/'([^']+)'/g)].map((m) => m[1]);
    assert.equal(steps.length, 10, id);
    for (const s of steps) assert.ok(names.has(s), `${id}: ${s}`);
  }
});

test('site shell: header logo, Email me key, footer links', async () => {
  const html = await readPage('');
  const header = html.match(/<header[\s\S]*?<\/header>/)[0];
  assert.match(header, /<img[^>]+j-logo/);
  assert.match(header, /class="brand-name">Jomari Villanueva</);
  assert.match(header, /<a[^>]+href="mailto:jomarivillanueva83@gmail\.com"[^>]*>\s*Email me\s*<\/a>/);
  const footer = html.match(/<footer[\s\S]*?<\/footer>/)[0];
  assert.match(footer, /Academic work/);
  assert.match(footer, /© \d{4} Jomari Villanueva/);
});

test('old URLs redirect under the base path', async () => {
  for (const route of ['research', 'teaching', 'writing'])
    assert.match(await readPage(route), new RegExp(`url=${base}academic/"`), route);
  for (const slug of ['applied-ai', 'ai-literacy-policy', 'digital-government', 'environmental-sensing'])
    assert.match(await readPage(`work/${slug}`), new RegExp(`url=${base}work/"`), slug);
});

test('homepage: hero, terminal final state, marquee, featured, cards, no CDNs', async () => {
  const html = await readPage('');
  const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)];
  assert.equal(h1s.length, 1);
  assert.equal(h1s[0][1].trim(), 'Hi, I’m Jom, and I automate repetitive tasks.');
  assert.match(html, /saving you up to\s*<strong class="hl">60 hours a month<\/strong>\./);
  assert.doesNotMatch(html, /3 hours a day/);
  // terminal is server-rendered in its final state
  const term = html.match(/<div[^>]+class="[^"]*\bterm\b[\s\S]*?<\/ol>/)[0];
  for (const line of [
    'Pulled stories from Hacker News, Reddit, and the web',
    'AI scored every story',
    'Sent the best to Slack: Keep or Kill',
    'Kept stories sent to the script writer',
    'Done</b> · 4 steps · scripts next',
  ])
    assert.match(term, new RegExp(line), line);
  assert.match(html, /find today(&#39;|')s best stories → score → vote/);
  assert.match(html, />Story scout</);
  assert.doesNotMatch(term, /Partnership|HubSpot/);
  assert.match(html, /Example run/);
  assert.doesNotMatch(html, /Live run/);
  assert.match(
    html,
    /<button[^>]*class="motion-toggle"[^>]*aria-pressed="false"[^>]*hidden[^>]*>Pause motion<\/button>/,
  );
  // decorative card diagrams carry no <title>/<desc> (no hover tooltips)
  for (const m of html.matchAll(/<svg[^>]*wfd--card[^>]*>[\s\S]*?<\/svg>/g)) {
    assert.doesNotMatch(m[0], /<title|<desc|aria-labelledby/);
  }
  // marquee: first item is Zapier, duplicate tracks hidden from AT
  const logos = [...html.matchAll(/<ul[^>]+class="logos"([^>]*)>([\s\S]*?)<\/ul>/g)];
  assert.ok(logos.length >= 2);
  assert.doesNotMatch(logos[0][1], /aria-hidden/);
  for (const l of logos.slice(1)) assert.match(l[1], /aria-hidden="true"/);
  const first = logos[0][2].match(/<li[^>]*>([\s\S]*?)<\/li>/)[1].replace(/<svg[\s\S]*?<\/svg>/g, '');
  assert.equal(first.trim(), 'Zapier');
  assert.match(logos[0][2], /<svg[^>]+fill="#FF4F00"[^>]*>\s*<use href="#si-zapier"/);
  assert.match(html, /<symbol id="si-zapier"[^>]*>\s*<path d="M/);
  // featured workflow
  assert.match(html, /Featured workflow · Content/);
  assert.match(
    html,
    /<h2 id="feat-title"[^>]*>\s*Your best stories, found and scored every morning\s*<\/h2>/,
  );
  const feat = html.match(/<section id="work"[\s\S]*?<\/section>/)[0];
  assert.match(feat, /data-step="9"/);
  assert.doesNotMatch(feat, /data-step="10"/);
  assert.match(feat, /Stories come in/);
  assert.match(feat, /AI does the first read/);
  assert.match(feat, /You make the call/);
  // step → beat mapping from copy: 1–4 → 0, 5–6 → 1, 7 → 2, 8–10 → 3
  const row = feat.match(/<svg[^>]*wfd--featured(?![^>]*wfd--column)[\s\S]*?<\/svg>/)[0];
  const beatsOf = [...row.matchAll(/data-step="(\d+)" data-beat="(\d+)"/g)].map((m) => [+m[1], +m[2]]);
  assert.deepEqual(
    beatsOf.map(([, b]) => b),
    [0, 0, 0, 0, 1, 1, 2, 3, 3, 3],
  );
  assert.match(row, /data-step="6" data-beat="2" data-kind="human"/);
  assert.match(row, /data-step="4" data-beat="1" data-kind="ai"/);
  assert.match(row, /Pull stories/);
  assert.doesNotMatch(row, /Fetch Reddit|Web search/);
  assert.doesNotMatch(feat, /Dashed line/);
  assert.match(feat, new RegExp(`href="${base}work/${STORY_SCOUT}/"[^>]*>\\s*See the full workflow`));
  assert.doesNotMatch(feat, /Partnership inquiries/);
  assert.match(html, new RegExp(`href="${base}work/"[^>]*>\\s*See my workflows`));
  // three cards with links
  const cards = html.match(/<section[^>]*aria-labelledby="more-title"[\s\S]*?<\/section>/)[0];
  const cardTitles = [...cards.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/g)].map((m) => m[1].trim());
  assert.deepEqual(cardTitles, [
    'A story in, a ready-to-film script out',
    'An AI that learns your taste',
    'Partnership inquiries, handled end to end',
  ]);
  for (const slug of [
    'content-pipeline-2-content-package-generator',
    'content-pipeline-3-weekly-preference-learning',
    'partnership-operations-automation',
  ])
    assert.match(cards, new RegExp(`href="${base}work/${slug}/"`), slug);
  assert.match(cards, new RegExp(`href="${base}work/"[^>]*>\\s*See all 12`));
  assert.match(html, /href="mailto:jomarivillanueva83@gmail\.com"[^>]*>\s*Email me/);
  assert.doesNotMatch(html, /cdn\.jsdelivr|fonts\.googleapis|fonts\.gstatic/);
});

test('work index lists all 12 workflows', async () => {
  const html = await readPage('work');
  const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)];
  assert.equal(h1s.length, 1);
  assert.equal(h1s[0][1].trim(), 'Workflows I built');
  assert.match(
    html,
    /Each one is built in Zapier and can be replicated in n8n, with AI doing the reading and a person approving what matters\./,
  );
  const links = new Set(
    [...html.matchAll(new RegExp(`href="${base}work/([a-z0-9-]+)/"`, 'g'))].map((m) => m[1]),
  );
  assert.equal(links.size, 12);
  assert.equal([...html.matchAll(/<article class="card/g)].length, 12);
  // listed in copy order: content pipeline first, then Partnership
  const order = [...html.matchAll(/<span class="tag">WF-(\d+)<\/span>/g)].map((m) => +m[1]);
  assert.deepEqual(order, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  const titles = [...html.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/g)].map((m) => m[1].trim());
  assert.deepEqual(titles.slice(0, 5), [
    'Your best stories, found and scored every morning',
    'A story in, a ready-to-film script out',
    'An AI that learns your taste',
    'A monthly check-up on your content engine',
    'Partnership inquiries, handled end to end',
  ]);
});

test('each workflow has a detail page', async () => {
  const data = JSON.parse(await readFile('src/data/workflows.json', 'utf8'));
  const copy = await readFile('src/data/workflow-copy.ts', 'utf8');
  assert.equal(data.length, 12);
  for (const w of data) {
    const html = await readPage(`work/${w.id}`);
    const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)];
    assert.equal(h1s.length, 1, w.id);
    const title = copy.match(new RegExp(`'${w.id}':\\s*\\{\\s*title:\\s*'([^']+)'`))[1];
    assert.equal(h1s[0][1].trim(), title, w.id);
    assert.match(html, new RegExp(`href="${base}work/"[^>]*>[^<]*All workflows`), w.id);
    assert.match(html, /<h2[^>]*>How it runs<\/h2>\s*<ol/, w.id);
    assert.match(html, /<h2[^>]*>Built with<\/h2>/, w.id);
    assert.match(html, /wfd--full/, w.id);
    assert.match(html, /Want one like this\?/, w.id);
    assert.match(html, /href="mailto:jomarivillanueva83@gmail\.com"[^>]*>\s*Email me/, w.id);
  }
  const p = await readPage('work/partnership-operations-automation');
  assert.match(p, /A person approves in Slack before anything moves\./);
  assert.match(p, /role="region"[^>]*aria-label="Workflow diagram, scroll sideways"/);
  assert.match(p, /tabindex="0"/); // server-rendered; script removes it when nothing overflows
  const ss = await readPage(`work/${STORY_SCOUT}`);
  assert.match(ss, /AI scores every story\./);
  assert.match(ss, /You get each one in Slack with Keep or Kill\./);
  assert.match(ss, /Nothing moves forward until you vote Keep in Slack\./);
  const human = ss.match(/<g[^>]*data-kind="human"[^>]*>[\s\S]*?<\/g>/g);
  assert.equal(human.length, 1);
  assert.match(human[0], />You vote</);
  const ai = ss.match(/<g[^>]*data-kind="ai"[^>]*>[\s\S]*?<\/g>/g);
  assert.equal(ai.length, 1);
  assert.match(ai[0], />AI scores it</);
  assert.match(ss, />Web search</); // parallel sources appear on the full diagram
  assert.doesNotMatch(ss, /Score AI Model|Score Output Parser/); // sub-nodes fold into the agent
  for (const t of ['Hacker News', 'Reddit', 'OpenAI', 'Slack', 'Google Sheets'])
    assert.match(ss, new RegExp(`<li>${t}</li>`), t);
  const mpr = await readPage('work/content-pipeline-4-monthly-performance-review');
  assert.doesNotMatch(mpr, /Where you stay in control/);
  assert.match(
    await readPage('work/content-pipeline-2-content-package-generator'),
    /The team reviews every script in Notion before it(&#39;|')s used\./,
  );
  const gf = await readPage('work/google-form-to-hubspot-with-10-link-and-1000-contract');
  assert.match(gf, /Only people who picked the free option continue\./);
  const e = await readPage('work/ai-email-classifier');
  assert.match(e, /Where you stay in control/);
  const inv = await readPage('work/create-invoice-from-hubspot-to-quickbooks');
  assert.doesNotMatch(inv, /Where you stay in control/);
  assert.match(e, /AI reads it and decides what it(&#39;|')s about\./);
  assert.doesNotMatch(e, /Slack Technical Issue/);
  assert.doesNotMatch(p, /Mark Inquiry As Read/);
  assert.match(copy.slice(copy.indexOf("'ai-email-classifier'")), /steps: \[/);
  assert.equal([...copy.matchAll(/^    steps: \[/gm)].length, 12);
});

test('about, academic, cv, and 404 pages', async () => {
  const academic = await readPage('academic');
  for (const doi of ['10.1109/ACDSA67686.2026.11468017', '10.1007/978-3-032-06634-3_6'])
    assert.ok(academic.includes(`https://doi.org/${doi}`), doi);
  assert.match(academic, /PCETT/);
  const about = await readPage('about');
  assert.match(about, /Jom/);
  assert.doesNotMatch(about.match(/<main[\s\S]*<\/main>/)[0], /Jomari/);
  assert.match(await readPage('cv'), /id="print-profile"/);
  const nf = await readFile('dist/404.html', 'utf8');
  assert.equal((nf.match(/<h1[\s>]/g) || []).length, 1);
});

test('workflow pages note Zapier build with n8n replication', async () => {
  for (const slug of ['ai-email-classifier', 'partnership-operations-automation', STORY_SCOUT]) {
    assert.match(await readPage(`work/${slug}/`), /Built in Zapier\. Can be replicated in n8n\./);
  }
});

test('pointer effects: follower is created by JS, script is bundled from the layout', async () => {
  const html = await readPage('');
  assert.doesNotMatch(html, /class="fx-ring"/);
  const scripts = [...html.matchAll(/<script type="module"(?: src="([^"]+)")?>([\s\S]*?)<\/script>/g)];
  let found = false;
  for (const [, src, inline] of scripts) {
    const code = src ? await readFile(join('dist', src.slice(base.length - 1)), 'utf8') : inline;
    if (code.includes('fx-ring')) found = true;
  }
  assert.ok(found, 'pointer-fx module not bundled');
  assert.match(await readPage('about'), /<script type="module"/);
});
