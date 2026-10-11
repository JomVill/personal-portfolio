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
