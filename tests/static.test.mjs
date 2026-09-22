import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
async function files(dir) { const entries = await readdir(dir, { withFileTypes: true }); return (await Promise.all(entries.map(e => e.isDirectory() ? files(join(dir,e.name)) : join(dir,e.name)))).flat(); }
test('all built internal links and assets resolve under the deployment base', async () => {
  const htmlFiles = (await files('dist')).filter(f => f.endsWith('.html'));
  assert.ok(htmlFiles.length >= 12);
  const home = await readFile('dist/index.html','utf8');
  const base = new URL(home.match(/rel="canonical" href="([^"]+)"/)[1]).pathname;
  for (const file of htmlFiles) {
    const html = await readFile(file,'utf8');
    assert.match(html, /<html lang="en"/);
    assert.equal((html.match(/<h1[ >]/g)||[]).length,1, file);
    for (const [, raw] of html.matchAll(/(?:href|src)="([^"#]+)[^"]*"/g)) {
      const url = raw.split('#')[0].split('?')[0];
      if (!url.startsWith('/')) continue;
      assert.ok(url.startsWith(base), `${file}: ${url} missing ${base}`);
      const relative = decodeURIComponent(url.slice(base.length));
      const target = join('dist', relative.endsWith('/') || !relative ? `${relative}index.html` : relative);
      await assert.doesNotReject(access(target), `${file}: missing ${target}`);
    }
  }
});
