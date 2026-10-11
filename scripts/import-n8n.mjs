// Usage: node scripts/import-n8n.mjs <exportDir>
// Reads every n8n workflow export (*.json) in <exportDir> and writes a sanitized
// src/data/workflows.json containing only: workflow name, node names, node types,
// node positions, and connections. Everything else (ids, credentials, parameters,
// webhook ids, settings, tags, sticky notes) is dropped.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const dir = process.argv[2];
if (!dir) {
  console.error('Usage: node scripts/import-n8n.mjs <exportDir>');
  process.exit(1);
}

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const files = (await readdir(dir)).filter((f) => f.endsWith('.json') && f !== 'sanitized.json').sort();

const workflows = [];
for (const file of files) {
  const raw = JSON.parse(await readFile(join(dir, file), 'utf8'));
  if (!raw || typeof raw.name !== 'string' || !Array.isArray(raw.nodes)) {
    console.warn(`skip ${file}: not a workflow export`);
    continue;
  }
  const nodes = raw.nodes
    .filter((n) => !String(n.type).endsWith('.stickyNote'))
    .map((n) => ({
      name: String(n.name),
      type: String(n.type).split('.').pop(),
      position: [Number(n.position?.[0]) || 0, Number(n.position?.[1]) || 0],
    }));
  const kept = new Set(nodes.map((n) => n.name));
  const edges = [];
  for (const [from, outputs] of Object.entries(raw.connections ?? {})) {
    if (!kept.has(from)) continue;
    for (const [kind, branches] of Object.entries(outputs ?? {})) {
      for (const branch of branches ?? []) {
        for (const c of branch ?? []) {
          if (kept.has(c?.node)) edges.push({ from, to: String(c.node), kind });
        }
      }
    }
  }
  workflows.push({ id: slugify(raw.name), name: raw.name, nodes, edges });
}

const ids = workflows.map((w) => w.id);
const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
if (dupes.length) throw new Error(`duplicate slugs: ${dupes.join(', ')}`);
workflows.sort((a, b) => a.id.localeCompare(b.id));

const out = new URL('../src/data/workflows.json', import.meta.url);
await writeFile(out, JSON.stringify(workflows, null, 2) + '\n');
console.log(`wrote ${workflows.length} workflows:\n${ids.sort().join('\n')}`);
