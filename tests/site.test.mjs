import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const readPage = (route) => readFile(join('dist', route, 'index.html'), 'utf8');

const home = await readFile('dist/index.html', 'utf8');
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
  assert.equal(data.length, 8);
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
  const featured = data.find((w) => w.id === 'partnership-operations-automation');
  const names = new Set(featured.nodes.map((n) => n.name));
  const path = copy.match(/mainPath: \[([^\]]+)\]/)[1];
  const steps = [...path.matchAll(/'([^']+)'/g)].map((m) => m[1]);
  assert.equal(steps.length, 10);
  for (const s of steps) assert.ok(names.has(s), s);
});

test('site shell: header logo, Email me key, footer links', async () => {
  const html = await readPage('');
  const header = html.match(/<header[\s\S]*?<\/header>/)[0];
  assert.match(header, /<img[^>]+alt="Jom — home"/);
  assert.match(header, /<a[^>]+href="mailto:jomarivillanueva83@gmail\.com"[^>]*>\s*Email me\s*<\/a>/);
  assert.doesNotMatch(header, /Jomari/);
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
